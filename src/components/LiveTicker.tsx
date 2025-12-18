const tickerItems = [
  { wallet: "0xF635 ... 7A7a", tickets: 7, item: "843095 manayev (manayev)", avatar: "🔵" },
  { wallet: "0x0Fe7 ... d6dD", tickets: 1, item: "4904750 shinzwrld999 (shinzwrld999)", avatar: "🟣" },
  { wallet: "0x7553 ... 83eA", tickets: 2, item: "525 Zora (ZORA)", avatar: "⚪" },
  { wallet: "0x1E51 ... 93CB", tickets: 4, item: "843095 manayev (manayev)", avatar: "🟠" },
  { wallet: "0xAF58 ... 98E7", tickets: 1, item: "33.1 Virtual Protocol (VIRTUAL)", avatar: "🟢" },
];

const LiveTicker = () => {
  return (
    <div className="bg-[#1A1A1E] border-b border-white/5 overflow-hidden">
      <div className="animate-slide-ticker flex items-center gap-8 py-2 whitespace-nowrap">
        {[...tickerItems, ...tickerItems].map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-xs">
            <span className="text-2xl">{item.avatar}</span>
            <span className="text-gray-500">{item.wallet}</span>
            <span className="text-gray-400">Purchased</span>
            <span className="text-[#A04545] font-mono font-bold">{item.tickets} TICKET{item.tickets > 1 ? 'S' : ''}</span>
            <span className="text-white font-medium">{item.item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveTicker;
