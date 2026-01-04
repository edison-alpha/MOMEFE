module drawraffle::draw_v4 {
    use std::signer;
    use std::vector;
    use std::string::{Self, String};
    use std::option::{Self, Option};
    use aptos_framework::coin::{Self};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::account::{Self, SignerCapability};
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::randomness;
    use aptos_framework::object::{Self};
    use aptos_framework::primary_fungible_store;
    use aptos_framework::fungible_asset::Metadata;
    use aptos_std::table::{Self, Table};
    use aptos_token_objects::token::Token as TokenV2;

    const E_NOT_INITIALIZED: u64 = 1;
    const E_ALREADY_INITIALIZED: u64 = 2;
    const E_RAFFLE_NOT_FOUND: u64 = 3;
    const E_RAFFLE_ENDED: u64 = 4;
    const E_RAFFLE_NOT_ENDED: u64 = 5;
    const E_INSUFFICIENT_PAYMENT: u64 = 6;
    const E_NOT_RAFFLE_CREATOR: u64 = 7;
    const E_RAFFLE_ALREADY_FINALIZED: u64 = 8;
    const E_INVALID_TICKET_AMOUNT: u64 = 10;
    const E_MAX_TICKETS_REACHED: u64 = 11;
    const E_NOT_WINNER: u64 = 12;
    const E_ALREADY_CLAIMED: u64 = 13;
    const E_CANNOT_CLAIM: u64 = 14;
    const E_INVALID_STATUS: u64 = 16;
    const E_TICKETS_ALREADY_SOLD: u64 = 19;
    const E_INSUFFICIENT_BALANCE: u64 = 20;
    const E_NFT_NOT_OWNED: u64 = 24;
    const E_NOT_ADMIN: u64 = 25;
    const E_ALREADY_REFUNDED: u64 = 26;
    const E_NO_TICKETS_TO_REFUND: u64 = 27;
    const E_RAFFLE_NOT_CANCELLED: u64 = 28;
    const E_INVALID_TICKET_PRICE: u64 = 29;
    const E_INVALID_TOTAL_TICKETS: u64 = 30;
    const E_INVALID_DURATION: u64 = 31;

    const PLATFORM_FEE_TARGET_MET_BPS: u64 = 1000;
    const PLATFORM_FEE_TARGET_UNMET_BPS: u64 = 500;
    const BPS_DENOMINATOR: u64 = 10000;
    const MIN_DURATION: u64 = 60;
    const MAX_DURATION: u64 = 31536000;

    const STATUS_LISTED: u8 = 1;
    const STATUS_RAFFLING: u8 = 2;
    const STATUS_ITEM_RAFFLED: u8 = 3;
    const STATUS_FUND_RAFFLED: u8 = 4;
    const STATUS_CANCELLED: u8 = 5;

    const TYPE_NATIVE: u8 = 0;
    const TYPE_FUNGIBLE_ASSET: u8 = 1;
    const TYPE_DIGITAL_ASSET: u8 = 2;
    const TYPE_RWA: u8 = 3;

    struct PrizeAsset has store, copy, drop {
        asset_type: u8,
        amount: u64,
        decimals: u8,
        fa_metadata: Option<address>,
        nft_address: Option<address>,
        symbol: String,
        name: String,
    }

    struct Raffle has store {
        id: u64,
        creator: address,
        title: String,
        description: String,
        image_url: String,
        ticket_price: u64,
        total_tickets: u64,
        tickets_sold: u64,
        target_amount: u64,
        prize_asset: PrizeAsset,
        end_time: u64,
        status: u8,
        winner: address,
        prize_pool: u64,
        is_claimed: bool,
        asset_in_escrow: bool,
        total_refunded: u64,
    }

    struct Ticket has store, copy, drop {
        raffle_id: u64,
        buyer: address,
        ticket_count: u64,
        purchase_time: u64,
        ticket_ids: vector<u64>,
    }

    struct UserTickets has store, copy, drop {
        raffle_id: u64,
        ticket_ids: vector<u64>,
        total_tickets: u64,
    }

    struct RefundRecord has store, copy, drop {
        raffle_id: u64,
        user: address,
        amount: u64,
        refunded_at: u64,
    }

    struct RaffleStore has key {
        signer_cap: SignerCapability,
        raffles: Table<u64, Raffle>,
        raffle_counter: u64,
        tickets: Table<u64, vector<Ticket>>,
        user_tickets: Table<address, vector<UserTickets>>,
        global_ticket_counter: u64,
        escrow_balance: u64,
        platform_fees: u64,
        refund_records: Table<u64, vector<RefundRecord>>,
        create_raffle_events: EventHandle<CreateRaffleEvent>,
        buy_ticket_events: EventHandle<BuyTicketEvent>,
        finalize_raffle_events: EventHandle<FinalizeRaffleEvent>,
        claim_prize_events: EventHandle<ClaimPrizeEvent>,
        cancel_raffle_events: EventHandle<CancelRaffleEvent>,
        refund_events: EventHandle<RefundEvent>,
    }

    struct CreateRaffleEvent has drop, store {
        raffle_id: u64,
        creator: address,
        title: String,
        ticket_price: u64,
        total_tickets: u64,
        target_amount: u64,
        end_time: u64,
        asset_type: u8,
        prize_amount: u64,
        prize_symbol: String,
    }

    struct BuyTicketEvent has drop, store {
        raffle_id: u64,
        buyer: address,
        ticket_count: u64,
        ticket_ids: vector<u64>,
        total_paid: u64,
    }

    struct FinalizeRaffleEvent has drop, store {
        raffle_id: u64,
        winner: address,
        winning_ticket_id: u64,
        status: u8,
        target_met: bool,
        prize_amount: u64,
        asset_type: u8,
    }

    struct ClaimPrizeEvent has drop, store {
        raffle_id: u64,
        winner: address,
        prize_type: String,
        amount: u64,
        asset_type: u8,
    }

    struct CancelRaffleEvent has drop, store {
        raffle_id: u64,
        cancelled_by: address,
        reason: String,
        tickets_sold: u64,
        refundable_amount: u64,
    }

    struct RefundEvent has drop, store {
        raffle_id: u64,
        user: address,
        ticket_count: u64,
        refund_amount: u64,
    }

    public entry fun initialize(admin: &signer, seed: vector<u8>) {
        let admin_addr = signer::address_of(admin);
        assert!(!exists<RaffleStore>(admin_addr), E_ALREADY_INITIALIZED);

        let (resource_signer, signer_cap) = account::create_resource_account(admin, seed);
        coin::register<AptosCoin>(&resource_signer);

        move_to(admin, RaffleStore {
            signer_cap,
            raffles: table::new(),
            raffle_counter: 0,
            tickets: table::new(),
            user_tickets: table::new(),
            global_ticket_counter: 0,
            escrow_balance: 0,
            platform_fees: 0,
            refund_records: table::new(),
            create_raffle_events: account::new_event_handle<CreateRaffleEvent>(admin),
            buy_ticket_events: account::new_event_handle<BuyTicketEvent>(admin),
            finalize_raffle_events: account::new_event_handle<FinalizeRaffleEvent>(admin),
            claim_prize_events: account::new_event_handle<ClaimPrizeEvent>(admin),
            cancel_raffle_events: account::new_event_handle<CancelRaffleEvent>(admin),
            refund_events: account::new_event_handle<RefundEvent>(admin),
        });
    }

    public entry fun create_raffle_native(
        creator: &signer,
        store_address: address,
        title: String,
        description: String,
        image_url: String,
        ticket_price: u64,
        total_tickets: u64,
        target_amount: u64,
        prize_amount: u64,
        duration_seconds: u64,
    ) acquires RaffleStore {
        let prize_asset = PrizeAsset {
            asset_type: TYPE_NATIVE,
            amount: prize_amount,
            decimals: 8,
            fa_metadata: option::none(),
            nft_address: option::none(),
            symbol: string::utf8(b"MOVE"),
            name: string::utf8(b"Movement"),
        };
        
        create_raffle_internal(
            creator, store_address, title, description, image_url,
            ticket_price, total_tickets, target_amount, duration_seconds,
            prize_asset
        );
    }

    public entry fun create_raffle_fa(
        creator: &signer,
        store_address: address,
        title: String,
        description: String,
        image_url: String,
        ticket_price: u64,
        total_tickets: u64,
        target_amount: u64,
        prize_amount: u64,
        duration_seconds: u64,
        fa_metadata_address: address,
        token_symbol: String,
        token_name: String,
        token_decimals: u8,
    ) acquires RaffleStore {
        let prize_asset = PrizeAsset {
            asset_type: TYPE_FUNGIBLE_ASSET,
            amount: prize_amount,
            decimals: token_decimals,
            fa_metadata: option::some(fa_metadata_address),
            nft_address: option::none(),
            symbol: token_symbol,
            name: token_name,
        };
        
        create_raffle_internal(
            creator, store_address, title, description, image_url,
            ticket_price, total_tickets, target_amount, duration_seconds,
            prize_asset
        );
    }

    public entry fun create_raffle_nft(
        creator: &signer,
        store_address: address,
        title: String,
        description: String,
        image_url: String,
        ticket_price: u64,
        total_tickets: u64,
        target_amount: u64,
        duration_seconds: u64,
        nft_object_address: address,
        nft_name: String,
    ) acquires RaffleStore {
        let prize_asset = PrizeAsset {
            asset_type: TYPE_DIGITAL_ASSET,
            amount: 1,
            decimals: 0,
            fa_metadata: option::none(),
            nft_address: option::some(nft_object_address),
            symbol: string::utf8(b"NFT"),
            name: nft_name,
        };
        
        create_raffle_internal(
            creator, store_address, title, description, image_url,
            ticket_price, total_tickets, target_amount, duration_seconds,
            prize_asset
        );
    }

    public entry fun create_raffle_rwa(
        creator: &signer,
        store_address: address,
        title: String,
        description: String,
        image_url: String,
        ticket_price: u64,
        total_tickets: u64,
        target_amount: u64,
        prize_amount: u64,
        duration_seconds: u64,
        rwa_metadata_address: address,
        rwa_symbol: String,
        rwa_name: String,
        rwa_decimals: u8,
    ) acquires RaffleStore {
        let prize_asset = PrizeAsset {
            asset_type: TYPE_RWA,
            amount: prize_amount,
            decimals: rwa_decimals,
            fa_metadata: option::some(rwa_metadata_address),
            nft_address: option::none(),
            symbol: rwa_symbol,
            name: rwa_name,
        };
        
        create_raffle_internal(
            creator, store_address, title, description, image_url,
            ticket_price, total_tickets, target_amount, duration_seconds,
            prize_asset
        );
    }

    fun create_raffle_internal(
        creator: &signer,
        store_address: address,
        title: String,
        description: String,
        image_url: String,
        ticket_price: u64,
        total_tickets: u64,
        target_amount: u64,
        duration_seconds: u64,
        prize_asset: PrizeAsset,
    ) acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);
        assert!(ticket_price > 0, E_INVALID_TICKET_PRICE);
        assert!(total_tickets > 0, E_INVALID_TOTAL_TICKETS);
        assert!(duration_seconds >= MIN_DURATION && duration_seconds <= MAX_DURATION, E_INVALID_DURATION);
        
        let creator_addr = signer::address_of(creator);
        let store = borrow_global_mut<RaffleStore>(store_address);
        let resource_addr = account::get_signer_capability_address(&store.signer_cap);
        
        let raffle_id = store.raffle_counter;
        store.raffle_counter = raffle_id + 1;
        let end_time = timestamp::now_seconds() + duration_seconds;

        if (prize_asset.asset_type == TYPE_NATIVE) {
            if (prize_asset.amount > 0) {
                assert!(coin::balance<AptosCoin>(creator_addr) >= prize_asset.amount, E_INSUFFICIENT_BALANCE);
                let prize_deposit = coin::withdraw<AptosCoin>(creator, prize_asset.amount);
                store.escrow_balance = store.escrow_balance + prize_asset.amount;
                coin::deposit(resource_addr, prize_deposit);
            };
        } else if (prize_asset.asset_type == TYPE_FUNGIBLE_ASSET || prize_asset.asset_type == TYPE_RWA) {
            if (prize_asset.amount > 0) {
                let fa_metadata_addr = *option::borrow(&prize_asset.fa_metadata);
                let metadata = object::address_to_object<Metadata>(fa_metadata_addr);
                primary_fungible_store::transfer(creator, metadata, resource_addr, prize_asset.amount);
            };
        } else if (prize_asset.asset_type == TYPE_DIGITAL_ASSET) {
            let nft_addr = *option::borrow(&prize_asset.nft_address);
            let nft_object = object::address_to_object<TokenV2>(nft_addr);
            assert!(object::is_owner(nft_object, creator_addr), E_NFT_NOT_OWNED);
            object::transfer(creator, nft_object, resource_addr);
        };

        let raffle_title = *&title;
        let prize_symbol = *&prize_asset.symbol;
        let prize_amount = prize_asset.amount;
        let asset_type = prize_asset.asset_type;

        let raffle = Raffle {
            id: raffle_id,
            creator: creator_addr,
            title,
            description,
            image_url,
            ticket_price,
            total_tickets,
            tickets_sold: 0,
            target_amount,
            prize_asset,
            end_time,
            status: STATUS_LISTED,
            winner: @0x0,
            prize_pool: 0,
            is_claimed: false,
            asset_in_escrow: true,
            total_refunded: 0,
        };

        table::add(&mut store.raffles, raffle_id, raffle);
        table::add(&mut store.tickets, raffle_id, vector::empty<Ticket>());
        table::add(&mut store.refund_records, raffle_id, vector::empty<RefundRecord>());

        event::emit_event(&mut store.create_raffle_events, CreateRaffleEvent {
            raffle_id,
            creator: creator_addr,
            title: raffle_title,
            ticket_price,
            total_tickets,
            target_amount,
            end_time,
            asset_type,
            prize_amount,
            prize_symbol,
        });
    }

    public entry fun buy_tickets(
        buyer: &signer,
        store_address: address,
        raffle_id: u64,
        ticket_count: u64,
    ) acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);
        assert!(ticket_count > 0, E_INVALID_TICKET_AMOUNT);

        let store = borrow_global_mut<RaffleStore>(store_address);
        assert!(table::contains(&store.raffles, raffle_id), E_RAFFLE_NOT_FOUND);

        let raffle = table::borrow_mut(&mut store.raffles, raffle_id);
        assert!(raffle.status == STATUS_LISTED, E_INVALID_STATUS);
        assert!(timestamp::now_seconds() < raffle.end_time, E_RAFFLE_ENDED);
        assert!(raffle.tickets_sold + ticket_count <= raffle.total_tickets, E_MAX_TICKETS_REACHED);

        let buyer_addr = signer::address_of(buyer);
        let total_cost = raffle.ticket_price * ticket_count;

        assert!(coin::balance<AptosCoin>(buyer_addr) >= total_cost, E_INSUFFICIENT_BALANCE);

        let payment = coin::withdraw<AptosCoin>(buyer, total_cost);
        raffle.prize_pool = raffle.prize_pool + total_cost;
        store.escrow_balance = store.escrow_balance + total_cost;
        
        let resource_addr = account::get_signer_capability_address(&store.signer_cap);
        coin::deposit(resource_addr, payment);

        let ticket_ids = vector::empty<u64>();
        let current_timestamp = timestamp::now_seconds();
        let i = 0;
        
        while (i < ticket_count) {
            let global_ticket_id = store.global_ticket_counter;
            store.global_ticket_counter = global_ticket_id + 1;
            vector::push_back(&mut ticket_ids, global_ticket_id);
            i = i + 1;
        };

        raffle.tickets_sold = raffle.tickets_sold + ticket_count;
        
        let ticket = Ticket {
            raffle_id,
            buyer: buyer_addr,
            ticket_count,
            purchase_time: current_timestamp,
            ticket_ids: ticket_ids,
        };

        let tickets = table::borrow_mut(&mut store.tickets, raffle_id);
        vector::push_back(tickets, ticket);

        if (!table::contains(&store.user_tickets, buyer_addr)) {
            table::add(&mut store.user_tickets, buyer_addr, vector::empty<UserTickets>());
        };
        
        let user_tickets_list = table::borrow_mut(&mut store.user_tickets, buyer_addr);
        let user_ticket = UserTickets {
            raffle_id,
            ticket_ids: *&ticket_ids,
            total_tickets: ticket_count,
        };
        vector::push_back(user_tickets_list, user_ticket);

        event::emit_event(&mut store.buy_ticket_events, BuyTicketEvent {
            raffle_id,
            buyer: buyer_addr,
            ticket_count,
            ticket_ids: *&ticket_ids,
            total_paid: total_cost,
        });
    }

    #[randomness]
    entry fun finalize_raffle(
        store_address: address,
        raffle_id: u64,
    ) acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);

        let store = borrow_global_mut<RaffleStore>(store_address);
        assert!(table::contains(&store.raffles, raffle_id), E_RAFFLE_NOT_FOUND);

        let raffle = table::borrow_mut(&mut store.raffles, raffle_id);
        assert!(raffle.status == STATUS_LISTED, E_RAFFLE_ALREADY_FINALIZED);
        assert!(
            timestamp::now_seconds() >= raffle.end_time || 
            raffle.tickets_sold >= raffle.total_tickets, 
            E_RAFFLE_NOT_ENDED
        );

        raffle.status = STATUS_RAFFLING;
        let asset_type = raffle.prize_asset.asset_type;

        if (raffle.tickets_sold == 0) {
            raffle.status = STATUS_CANCELLED;
            raffle.asset_in_escrow = false;
            
            event::emit_event(&mut store.finalize_raffle_events, FinalizeRaffleEvent {
                raffle_id,
                winner: @0x0,
                winning_ticket_id: 0,
                status: STATUS_CANCELLED,
                target_met: false,
                prize_amount: 0,
                asset_type,
            });
            return
        };

        let tickets = table::borrow(&store.tickets, raffle_id);
        let total_ticket_entries = 0u64;
        let i = 0;
        let len = vector::length(tickets);
        
        while (i < len) {
            let ticket = vector::borrow(tickets, i);
            total_ticket_entries = total_ticket_entries + ticket.ticket_count;
            i = i + 1;
        };

        let winning_ticket_number = randomness::u64_range(0, total_ticket_entries);
        
        let winner_addr = @0x0;
        let winning_ticket_id = 0u64;
        let cumulative = 0u64;
        i = 0;
        
        while (i < len) {
            let ticket = vector::borrow(tickets, i);
            let ticket_start = cumulative;
            cumulative = cumulative + ticket.ticket_count;
            
            if (winning_ticket_number < cumulative) {
                winner_addr = ticket.buyer;
                let offset = winning_ticket_number - ticket_start;
                winning_ticket_id = *vector::borrow(&ticket.ticket_ids, offset);
                break
            };
            i = i + 1;
        };

        raffle.winner = winner_addr;
        let target_met = raffle.prize_pool >= raffle.target_amount;

        if (target_met) {
            raffle.status = STATUS_ITEM_RAFFLED;
            
            let platform_fee = (raffle.prize_pool * PLATFORM_FEE_TARGET_MET_BPS) / BPS_DENOMINATOR;
            let seller_amount = raffle.prize_pool - platform_fee;
            
            store.platform_fees = store.platform_fees + platform_fee;
            store.escrow_balance = store.escrow_balance - raffle.prize_pool;
            
            if (seller_amount > 0) {
                let resource_signer = account::create_signer_with_capability(&store.signer_cap);
                let seller_payment = coin::withdraw<AptosCoin>(&resource_signer, seller_amount);
                coin::deposit(raffle.creator, seller_payment);
            };
            
            raffle.asset_in_escrow = true;
            
            event::emit_event(&mut store.finalize_raffle_events, FinalizeRaffleEvent {
                raffle_id,
                winner: winner_addr,
                winning_ticket_id,
                status: STATUS_ITEM_RAFFLED,
                target_met: true,
                prize_amount: raffle.prize_asset.amount,
                asset_type,
            });
        } else {
            raffle.status = STATUS_FUND_RAFFLED;
            
            let platform_fee = (raffle.prize_pool * PLATFORM_FEE_TARGET_UNMET_BPS) / BPS_DENOMINATOR;
            let winner_amount = raffle.prize_pool - platform_fee;
            
            store.platform_fees = store.platform_fees + platform_fee;
            store.escrow_balance = store.escrow_balance - raffle.prize_pool;
            
            raffle.asset_in_escrow = false;
            
            event::emit_event(&mut store.finalize_raffle_events, FinalizeRaffleEvent {
                raffle_id,
                winner: winner_addr,
                winning_ticket_id,
                status: STATUS_FUND_RAFFLED,
                target_met: false,
                prize_amount: winner_amount,
                asset_type,
            });
        };
    }

    public entry fun claim_prize(
        claimer: &signer,
        store_address: address,
        raffle_id: u64,
    ) acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);

        let claimer_addr = signer::address_of(claimer);
        let store = borrow_global_mut<RaffleStore>(store_address);
        assert!(table::contains(&store.raffles, raffle_id), E_RAFFLE_NOT_FOUND);

        let raffle = table::borrow_mut(&mut store.raffles, raffle_id);
        assert!(!raffle.is_claimed, E_ALREADY_CLAIMED);
        assert!(raffle.winner == claimer_addr, E_NOT_WINNER);
        
        let asset_type = raffle.prize_asset.asset_type;
        let resource_signer = account::create_signer_with_capability(&store.signer_cap);
        
        if (raffle.status == STATUS_ITEM_RAFFLED) {
            if (asset_type == TYPE_NATIVE) {
                if (raffle.prize_asset.amount > 0) {
                    let prize = coin::withdraw<AptosCoin>(&resource_signer, raffle.prize_asset.amount);
                    coin::deposit(claimer_addr, prize);
                    store.escrow_balance = store.escrow_balance - raffle.prize_asset.amount;
                };
            } else if (asset_type == TYPE_FUNGIBLE_ASSET || asset_type == TYPE_RWA) {
                if (raffle.prize_asset.amount > 0) {
                    let fa_metadata_addr = *option::borrow(&raffle.prize_asset.fa_metadata);
                    let metadata = object::address_to_object<Metadata>(fa_metadata_addr);
                    primary_fungible_store::transfer(&resource_signer, metadata, claimer_addr, raffle.prize_asset.amount);
                };
            } else if (asset_type == TYPE_DIGITAL_ASSET) {
                let nft_addr = *option::borrow(&raffle.prize_asset.nft_address);
                let nft_object = object::address_to_object<TokenV2>(nft_addr);
                object::transfer(&resource_signer, nft_object, claimer_addr);
            };
            
            raffle.is_claimed = true;
            raffle.asset_in_escrow = false;
            
            event::emit_event(&mut store.claim_prize_events, ClaimPrizeEvent {
                raffle_id,
                winner: claimer_addr,
                prize_type: raffle.prize_asset.symbol,
                amount: raffle.prize_asset.amount,
                asset_type,
            });
        } else if (raffle.status == STATUS_FUND_RAFFLED) {
            let platform_fee = (raffle.prize_pool * PLATFORM_FEE_TARGET_UNMET_BPS) / BPS_DENOMINATOR;
            let winner_amount = raffle.prize_pool - platform_fee;
            
            let prize = coin::withdraw<AptosCoin>(&resource_signer, winner_amount);
            coin::deposit(claimer_addr, prize);
            
            raffle.is_claimed = true;
            
            event::emit_event(&mut store.claim_prize_events, ClaimPrizeEvent {
                raffle_id,
                winner: claimer_addr,
                prize_type: string::utf8(b"MOVE"),
                amount: winner_amount,
                asset_type: TYPE_NATIVE,
            });
        } else {
            abort E_CANNOT_CLAIM
        };
    }

    public entry fun claim_refund(
        claimer: &signer,
        store_address: address,
        raffle_id: u64,
    ) acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);

        let claimer_addr = signer::address_of(claimer);
        let store = borrow_global_mut<RaffleStore>(store_address);
        assert!(table::contains(&store.raffles, raffle_id), E_RAFFLE_NOT_FOUND);

        let raffle = table::borrow_mut(&mut store.raffles, raffle_id);
        assert!(raffle.status == STATUS_CANCELLED, E_RAFFLE_NOT_CANCELLED);
        
        let refund_records = table::borrow(&store.refund_records, raffle_id);
        let already_refunded = false;
        let i = 0;
        let len = vector::length(refund_records);
        while (i < len) {
            let record = vector::borrow(refund_records, i);
            if (record.user == claimer_addr) {
                already_refunded = true;
                break
            };
            i = i + 1;
        };
        assert!(!already_refunded, E_ALREADY_REFUNDED);
        
        let tickets = table::borrow(&store.tickets, raffle_id);
        let user_ticket_count = 0u64;
        i = 0;
        len = vector::length(tickets);
        while (i < len) {
            let ticket = vector::borrow(tickets, i);
            if (ticket.buyer == claimer_addr) {
                user_ticket_count = user_ticket_count + ticket.ticket_count;
            };
            i = i + 1;
        };
        
        assert!(user_ticket_count > 0, E_NO_TICKETS_TO_REFUND);
        
        let refund_amount = raffle.ticket_price * user_ticket_count;
        
        let resource_signer = account::create_signer_with_capability(&store.signer_cap);
        let refund = coin::withdraw<AptosCoin>(&resource_signer, refund_amount);
        coin::deposit(claimer_addr, refund);
        
        store.escrow_balance = store.escrow_balance - refund_amount;
        raffle.total_refunded = raffle.total_refunded + refund_amount;
        
        let refund_records_mut = table::borrow_mut(&mut store.refund_records, raffle_id);
        vector::push_back(refund_records_mut, RefundRecord {
            raffle_id,
            user: claimer_addr,
            amount: refund_amount,
            refunded_at: timestamp::now_seconds(),
        });
        
        event::emit_event(&mut store.refund_events, RefundEvent {
            raffle_id,
            user: claimer_addr,
            ticket_count: user_ticket_count,
            refund_amount,
        });
    }

    public entry fun claim_back_asset(
        creator: &signer,
        store_address: address,
        raffle_id: u64,
    ) acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);

        let creator_addr = signer::address_of(creator);
        let store = borrow_global_mut<RaffleStore>(store_address);
        assert!(table::contains(&store.raffles, raffle_id), E_RAFFLE_NOT_FOUND);

        let raffle = table::borrow_mut(&mut store.raffles, raffle_id);
        assert!(raffle.creator == creator_addr, E_NOT_RAFFLE_CREATOR);
        assert!(
            raffle.status == STATUS_CANCELLED || 
            raffle.status == STATUS_FUND_RAFFLED, 
            E_CANNOT_CLAIM
        );
        
        let asset_type = raffle.prize_asset.asset_type;
        let resource_signer = account::create_signer_with_capability(&store.signer_cap);
        
        if (raffle.asset_in_escrow) {
            if (asset_type == TYPE_NATIVE) {
                if (raffle.prize_asset.amount > 0) {
                    let prize_return = coin::withdraw<AptosCoin>(&resource_signer, raffle.prize_asset.amount);
                    coin::deposit(creator_addr, prize_return);
                    store.escrow_balance = store.escrow_balance - raffle.prize_asset.amount;
                };
            } else if (asset_type == TYPE_FUNGIBLE_ASSET || asset_type == TYPE_RWA) {
                if (raffle.prize_asset.amount > 0) {
                    let fa_metadata_addr = *option::borrow(&raffle.prize_asset.fa_metadata);
                    let metadata = object::address_to_object<Metadata>(fa_metadata_addr);
                    primary_fungible_store::transfer(&resource_signer, metadata, creator_addr, raffle.prize_asset.amount);
                };
            } else if (asset_type == TYPE_DIGITAL_ASSET) {
                let nft_addr = *option::borrow(&raffle.prize_asset.nft_address);
                let nft_object = object::address_to_object<TokenV2>(nft_addr);
                object::transfer(&resource_signer, nft_object, creator_addr);
            };
        };
        
        raffle.asset_in_escrow = false;
        
        event::emit_event(&mut store.claim_prize_events, ClaimPrizeEvent {
            raffle_id,
            winner: creator_addr,
            prize_type: string::utf8(b"asset_return"),
            amount: raffle.prize_asset.amount,
            asset_type,
        });
    }

    public entry fun cancel_raffle(
        creator: &signer,
        store_address: address,
        raffle_id: u64,
    ) acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);

        let creator_addr = signer::address_of(creator);
        let store = borrow_global_mut<RaffleStore>(store_address);
        assert!(table::contains(&store.raffles, raffle_id), E_RAFFLE_NOT_FOUND);

        let raffle = table::borrow_mut(&mut store.raffles, raffle_id);
        assert!(raffle.creator == creator_addr, E_NOT_RAFFLE_CREATOR);
        assert!(raffle.status == STATUS_LISTED, E_RAFFLE_ALREADY_FINALIZED);
        assert!(raffle.tickets_sold == 0, E_TICKETS_ALREADY_SOLD);

        raffle.status = STATUS_CANCELLED;
        
        event::emit_event(&mut store.cancel_raffle_events, CancelRaffleEvent {
            raffle_id,
            cancelled_by: creator_addr,
            reason: string::utf8(b"creator_cancelled"),
            tickets_sold: 0,
            refundable_amount: 0,
        });
    }

    public entry fun admin_force_cancel(
        admin: &signer,
        store_address: address,
        raffle_id: u64,
        reason: String,
    ) acquires RaffleStore {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == store_address, E_NOT_ADMIN);
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);

        let store = borrow_global_mut<RaffleStore>(store_address);
        assert!(table::contains(&store.raffles, raffle_id), E_RAFFLE_NOT_FOUND);

        let raffle = table::borrow_mut(&mut store.raffles, raffle_id);
        assert!(raffle.status == STATUS_LISTED, E_RAFFLE_ALREADY_FINALIZED);

        let tickets_sold = raffle.tickets_sold;
        let refundable_amount = raffle.prize_pool;
        
        raffle.status = STATUS_CANCELLED;
        
        event::emit_event(&mut store.cancel_raffle_events, CancelRaffleEvent {
            raffle_id,
            cancelled_by: admin_addr,
            reason,
            tickets_sold,
            refundable_amount,
        });
    }

    public entry fun withdraw_fees(
        admin: &signer,
        store_address: address,
        amount: u64,
    ) acquires RaffleStore {
        let admin_addr = signer::address_of(admin);
        assert!(admin_addr == store_address, E_NOT_ADMIN);
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);

        let store = borrow_global_mut<RaffleStore>(store_address);
        assert!(store.platform_fees >= amount, E_INSUFFICIENT_PAYMENT);

        store.platform_fees = store.platform_fees - amount;
        
        let resource_signer = account::create_signer_with_capability(&store.signer_cap);
        let fees = coin::withdraw<AptosCoin>(&resource_signer, amount);
        coin::deposit(admin_addr, fees);
    }

    #[view]
    public fun get_raffle(store_address: address, raffle_id: u64): (
        u64, address, String, String, String, u64, u64, u64, u64, u64, u64, u8, address, u64, bool, bool, u8, String, String, u8, u64
    ) acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);
        let store = borrow_global<RaffleStore>(store_address);
        assert!(table::contains(&store.raffles, raffle_id), E_RAFFLE_NOT_FOUND);

        let raffle = table::borrow(&store.raffles, raffle_id);
        (
            raffle.id,
            raffle.creator,
            raffle.title,
            raffle.description,
            raffle.image_url,
            raffle.ticket_price,
            raffle.total_tickets,
            raffle.tickets_sold,
            raffle.target_amount,
            raffle.prize_asset.amount,
            raffle.end_time,
            raffle.status,
            raffle.winner,
            raffle.prize_pool,
            raffle.is_claimed,
            raffle.asset_in_escrow,
            raffle.prize_asset.asset_type,
            raffle.prize_asset.symbol,
            raffle.prize_asset.name,
            raffle.prize_asset.decimals,
            raffle.total_refunded,
        )
    }

    #[view]
    public fun get_raffle_prize_asset(store_address: address, raffle_id: u64): (
        u8, u64, u8, Option<address>, Option<address>, String, String
    ) acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);
        let store = borrow_global<RaffleStore>(store_address);
        assert!(table::contains(&store.raffles, raffle_id), E_RAFFLE_NOT_FOUND);

        let raffle = table::borrow(&store.raffles, raffle_id);
        (
            raffle.prize_asset.asset_type,
            raffle.prize_asset.amount,
            raffle.prize_asset.decimals,
            raffle.prize_asset.fa_metadata,
            raffle.prize_asset.nft_address,
            raffle.prize_asset.symbol,
            raffle.prize_asset.name,
        )
    }

    #[view]
    public fun get_raffle_count(store_address: address): u64 acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);
        let store = borrow_global<RaffleStore>(store_address);
        store.raffle_counter
    }

    #[view]
    public fun get_platform_fees(store_address: address): u64 acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);
        let store = borrow_global<RaffleStore>(store_address);
        store.platform_fees
    }

    #[view]
    public fun get_user_tickets(store_address: address, user: address): vector<UserTickets> acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);
        let store = borrow_global<RaffleStore>(store_address);
        
        if (table::contains(&store.user_tickets, user)) {
            *table::borrow(&store.user_tickets, user)
        } else {
            vector::empty<UserTickets>()
        }
    }

    #[view]
    public fun get_raffle_tickets(store_address: address, raffle_id: u64): vector<Ticket> acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);
        let store = borrow_global<RaffleStore>(store_address);
        assert!(table::contains(&store.tickets, raffle_id), E_RAFFLE_NOT_FOUND);
        
        *table::borrow(&store.tickets, raffle_id)
    }

    #[view]
    public fun is_target_met(store_address: address, raffle_id: u64): bool acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);
        let store = borrow_global<RaffleStore>(store_address);
        assert!(table::contains(&store.raffles, raffle_id), E_RAFFLE_NOT_FOUND);
        
        let raffle = table::borrow(&store.raffles, raffle_id);
        raffle.prize_pool >= raffle.target_amount
    }

    #[view]
    public fun get_escrow_balance(store_address: address): u64 acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);
        let store = borrow_global<RaffleStore>(store_address);
        store.escrow_balance
    }

    #[view]
    public fun get_global_ticket_count(store_address: address): u64 acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);
        let store = borrow_global<RaffleStore>(store_address);
        store.global_ticket_counter
    }

    #[view]
    public fun has_claimed_refund(store_address: address, raffle_id: u64, user: address): bool acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);
        let store = borrow_global<RaffleStore>(store_address);
        
        if (!table::contains(&store.refund_records, raffle_id)) {
            return false
        };
        
        let refund_records = table::borrow(&store.refund_records, raffle_id);
        let i = 0;
        let len = vector::length(refund_records);
        while (i < len) {
            let record = vector::borrow(refund_records, i);
            if (record.user == user) {
                return true
            };
            i = i + 1;
        };
        false
    }

    #[view]
    public fun get_refundable_amount(store_address: address, raffle_id: u64, user: address): u64 acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);
        let store = borrow_global<RaffleStore>(store_address);
        assert!(table::contains(&store.raffles, raffle_id), E_RAFFLE_NOT_FOUND);
        
        let raffle = table::borrow(&store.raffles, raffle_id);
        
        if (raffle.status != STATUS_CANCELLED) {
            return 0
        };
        
        if (table::contains(&store.refund_records, raffle_id)) {
            let refund_records = table::borrow(&store.refund_records, raffle_id);
            let i = 0;
            let len = vector::length(refund_records);
            while (i < len) {
                let record = vector::borrow(refund_records, i);
                if (record.user == user) {
                    return 0
                };
                i = i + 1;
            };
        };
        
        let tickets = table::borrow(&store.tickets, raffle_id);
        let user_ticket_count = 0u64;
        let i = 0;
        let len = vector::length(tickets);
        while (i < len) {
            let ticket = vector::borrow(tickets, i);
            if (ticket.buyer == user) {
                user_ticket_count = user_ticket_count + ticket.ticket_count;
            };
            i = i + 1;
        };
        
        raffle.ticket_price * user_ticket_count
    }

    #[view]
    public fun get_refund_records(store_address: address, raffle_id: u64): vector<RefundRecord> acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);
        let store = borrow_global<RaffleStore>(store_address);
        
        if (!table::contains(&store.refund_records, raffle_id)) {
            return vector::empty<RefundRecord>()
        };
        
        *table::borrow(&store.refund_records, raffle_id)
    }

    #[view]
    public fun get_total_refunded(store_address: address, raffle_id: u64): u64 acquires RaffleStore {
        assert!(exists<RaffleStore>(store_address), E_NOT_INITIALIZED);
        let store = borrow_global<RaffleStore>(store_address);
        assert!(table::contains(&store.raffles, raffle_id), E_RAFFLE_NOT_FOUND);
        
        let raffle = table::borrow(&store.raffles, raffle_id);
        raffle.total_refunded
    }

    #[view]
    public fun asset_type_native(): u8 { TYPE_NATIVE }
    
    #[view]
    public fun asset_type_fungible_asset(): u8 { TYPE_FUNGIBLE_ASSET }
    
    #[view]
    public fun asset_type_digital_asset(): u8 { TYPE_DIGITAL_ASSET }
    
    #[view]
    public fun asset_type_rwa(): u8 { TYPE_RWA }

    #[view]
    public fun status_listed(): u8 { STATUS_LISTED }
    
    #[view]
    public fun status_raffling(): u8 { STATUS_RAFFLING }
    
    #[view]
    public fun status_item_raffled(): u8 { STATUS_ITEM_RAFFLED }
    
    #[view]
    public fun status_fund_raffled(): u8 { STATUS_FUND_RAFFLED }
    
    #[view]
    public fun status_cancelled(): u8 { STATUS_CANCELLED }
}
