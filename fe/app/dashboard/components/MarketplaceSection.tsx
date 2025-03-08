import { useState } from "react";
import { IoStorefrontSharp, IoSearchOutline } from "react-icons/io5";
import Image from "next/image";
import { GameData } from "@/app/utils/AppContext";

interface MarketItem {
  id: string;
  name: string;
  price: number;
  image: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Legendary" | "Mythical";
  type: "Natural" | "Special";
  game: string;
}

export default function MarketplaceSection({ selectedGame }: { selectedGame: GameData }) {
  const [items] = useState<MarketItem[]>([
    {
      id: "1",
      name: "Rocket",
      price: 2750.78,
      image: "/rocket.jpg",
      rarity: "Common",
      type: "Natural",
      game: "Awesome Game 101",
    },
    {
      id: "2",
      name: "Rocket",
      price: 2750.78,
      image: "/rocket.jpg",
      rarity: "Uncommon",
      type: "Special",
      game: "Awesome Game 101",
    },
    {
      id: "3",
      name: "Rocket",
      price: 2750.78,
      image: "/rocket.jpg",
      rarity: "Rare",
      type: "Natural",
      game: "Awesome Game 101",
    },
    {
      id: "3",
      name: "Rocket",
      price: 2750.78,
      image: "/rocket.jpg",
      rarity: "Legendary",
      type: "Natural",
      game: "Awesome Game 101",
    },
    {
      id: "3",
      name: "Rocket",
      price: 2750.78,
      image: "/rocket.jpg",
      rarity: "Mythical",
      type: "Natural",
      game: "Awesome Game 101",
    },
  ]);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [selectedRarity, setSelectedRarity] = useState<string>("All");

  const handlePriceChange = (value: number, type: "min" | "max") => {
    if (type === "min") {
      setPriceRange([value, priceRange[1]]);
    } else {
      setPriceRange([priceRange[0], value]);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-2 md:p-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <IoStorefrontSharp className="text-3xl text-green" />
          <h2 className="text-2xl font-bold text-white">Marketplace</h2>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="space-y-4 bg-slate-800/80 p-6 rounded-lg">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900/90 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-green border border-slate-700/50"
            />
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-slate-900/90 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green border border-slate-700/50"
            >
              <option value="All">All Types</option>
              <option value="Natural">Natural</option>
              <option value="Special">Special</option>
            </select>

            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="bg-slate-900/90 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green border border-slate-700/50"
            >
              <option value="All">All Rarities</option>
              <option value="Common">Common</option>
              <option value="Uncommon">Uncommon</option>
              <option value="Rare">Rare</option>
              <option value="Legendary">Legendary</option>
              <option value="Mythical">Mythical</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-end justify-between mt-4">
          <div className="space-y-2">
            <label className="text-gray-400 text-sm">Price Range</label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  min="0"
                  max={priceRange[1]}
                  value={priceRange[0]}
                  onChange={(e) =>
                    handlePriceChange(Number(e.target.value), "min")
                  }
                  className="w-24 bg-slate-900 text-white rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green border border-slate-700/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
              <span className="text-gray-400">to</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">$</span>
                <input
                  type="number"
                  min={priceRange[0]}
                  value={priceRange[1]}
                  onChange={(e) =>
                    handlePriceChange(Number(e.target.value), "max")
                  }
                  className="w-24 bg-slate-900 text-white rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-green border border-slate-700/50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {["Common", "Uncommon", "Rare", "Legendary", "Mythical"].map(
              (rarity) => (
                <button
                  key={rarity}
                  onClick={() =>
                    setSelectedRarity(
                      rarity === selectedRarity ? "All" : rarity
                    )
                  }
                  className={`px-4 py-2 rounded text-sm text-white ${
                    rarity === selectedRarity
                      ? rarity === "Legendary"
                        ? "bg-yellow-500"
                        : rarity === "Rare"
                        ? "bg-blue-500"
                        : rarity === "Uncommon"
                        ? "bg-[#2fce5f]"
                        : rarity === "Common"
                        ? "bg-gray-500"
                        : "bg-purple-500"
                      : rarity === "Legendary"
                      ? "bg-yellow-500/40"
                      : rarity === "Rare"
                      ? "bg-blue-500/40"
                      : rarity === "Uncommon"
                      ? "bg-green/40"
                      : rarity === "Common"
                      ? "bg-gray-500/40"
                      : "bg-purple-500/40"
                  }`}
                >
                  {rarity}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-slate-800/80 rounded-lg overflow-hidden hover:scale-[1.02] transition-transform"
          >
            <div className="aspect-square relative">
              <Image
                src={item.image}
                alt={item.name}
                width={100}
                height={100}
                className="w-full h-full object-cover"
              />
              <span
                className={`absolute top-2 right-2 px-2 py-1 rounded text-xs text-white ${
                  item.rarity === "Legendary"
                    ? "bg-yellow-500/40"
                    : item.rarity === "Rare"
                    ? "bg-blue-500/40"
                    : item.rarity === "Uncommon"
                    ? "bg-green/40"
                    : item.rarity === "Common"
                    ? "bg-gray-500/40"
                    : "bg-purple-500/40"
                }`}
              >
                {item.rarity}
              </span>
            </div>

            <div className="p-4">
              <h3 className="text-white font-medium mb-1">{item.name}</h3>
              <p className="text-gray-400 text-sm mb-2">{item.game}</p>
              <div className="flex justify-between items-center">
                <span className="text-green font-medium">
                  ${item.price.toLocaleString()}
                </span>
                <button className="bg-green hover:bg-green/90 text-white px-3 py-1 rounded-lg text-sm transition-colors">
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
