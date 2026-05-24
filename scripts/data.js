export const products = [
  {
    title: "About A Chair 22",
    maker: "HAY Design",
    category: "seating",
    meta: "Original by Artek - Stockholm",
    price: "$185",
    rrp: "RRP $2,400",
    condition: "Like New",
    image: "assets/figma-export/c7a2095a5d0eb16cbdcad4fcb7c6f07e034adb0f.png",
    alt: "Black Scandinavian chair"
  },
  {
    title: "Control Table Lamp",
    maker: "Muuto",
    category: "decor",
    meta: "Handcrafted - Berlin",
    price: "$120",
    rrp: "Curated Selection",
    condition: "Pristine",
    image: "assets/figma-export/585f92e3662d379261eb92c36f8bc58c7e846362.png",
    alt: "Black table lamp"
  },
  {
    title: "Grib Toolbox Vase",
    maker: "Ferm Living",
    category: "decor",
    meta: "Set of 3 - Copenhagen",
    price: "$85",
    rrp: "One-of-a-kind",
    condition: "Excellent",
    image: "assets/figma-export/e24b16ff6b341c1759a6066cedd4c69ab55c09ee.png",
    alt: "White ceramic vases"
  },
  {
    title: "Elowen Lounge Chair",
    maker: "Artek",
    category: "seating",
    meta: "Original by Artek - Stockholm",
    price: "$850",
    rrp: "RRP $2,400",
    condition: "Like New",
    image: "assets/figma-export/c92ff17556827d47a8e24c0f458a0824ae243188.png",
    alt: "Gray oak lounge chair"
  },
  {
    title: "Walnut Writing Bureau",
    maker: "Vintage Studio",
    category: "storage",
    meta: "Circa 1960 - London",
    price: "$1,100",
    rrp: "Vintage",
    condition: "Good",
    image: "assets/figma-export/2c599988de934055ead448b9abf9204292e752e2.png",
    alt: "Walnut writing bureau"
  },
  {
    title: "Brass Sculptural Lamp",
    maker: "Atelier Nocturne",
    category: "decor",
    meta: "Handcrafted - Berlin",
    price: "$340",
    rrp: "Curated Selection",
    condition: "Excellent",
    image: "assets/figma-export/d7ab5e4107ceb6fa602d2a38b6fd105e10f50217.jpg",
    alt: "Brass sculptural lamp"
  },
  {
    title: "Mags Soft Modular",
    maker: "HAY",
    category: "seating",
    meta: "Original by HAY - Paris",
    price: "$2,900",
    rrp: "RRP $4,200",
    condition: "Like New",
    image: "assets/figma-export/ff589ffcc586624306d3a40d43bc7c5c6a29c8eb.png",
    alt: "Gray modular sofa"
  },
  {
    title: "Oak Arc Table",
    maker: "Custom Made",
    category: "storage",
    meta: "Custom Made - Amsterdam",
    price: "$1,450",
    rrp: "Authentic",
    condition: "Like New",
    image: "assets/figma-export/70e1f26af8d8c8a801bc699d95272597eb1791a6.png",
    alt: "Oak dining table"
  }
];

export const seedDatabase = {
  users: [
    {
      id: 1,
      name: "Vivian",
      email: "vivian@rehome.test",
      password: "rehome123",
      role: "buyer"
    },
    {
      id: 2,
      name: "Elena",
      email: "seller@rehome.test",
      password: "seller123",
      role: "seller"
    },
    {
      id: 3,
      name: "Arya",
      email: "admin@rehome.test",
      password: "admin123",
      role: "admin"
    }
  ],
  settings: {
    currency: "USD",
    theme: "light",
    emailNotifications: true,
    carbonTracking: true
  },
  cart: [
    {
      title: "Artisan Stoneware Vase",
      label: "Sustainable Craft",
      meta: "Found in Copenhagen - Second Life Condition",
      price: "$185.00",
      amount: 185,
      carbonOffset: 1.4,
      image: "assets/figma-export/10907fcec39fe57f8da3efc5dd8ce8633d20fa2c.jpg"
    },
    {
      title: "Reclaimed Oak Lounge Chair",
      label: "Timeless Design",
      meta: "Found in Stockholm - Pristine Condition",
      price: "$640.00",
      amount: 640,
      carbonOffset: 2.4,
      image: "assets/figma-export/50c650dc19d53b235c064dcad7dc23f8b08e5668.png"
    },
    {
      title: "Heirloom Linen Throw",
      label: "Natural Fiber",
      meta: "Organic Dye - Hand-woven in Belgium",
      price: "$120.00",
      amount: 120,
      carbonOffset: 0.7,
      image: "assets/figma-export/11bfba43714913c66eebc25b3e720fe59aa253b0.jpg"
    }
  ],
  history: [
    {
      date: "Oct 12, 2026",
      status: "Delivered",
      title: "Arne Jacobsen Lily Chair",
      description: "Original vintage, restored in Copenhagen.",
      price: "IDR 840.000",
      action: "Track Order"
    },
    {
      date: "Sep 28, 2026",
      status: "Delivered",
      title: "Amber Glass Organic Vase",
      description: "Hand-blown in Murano, Italy. 1970s.",
      price: "IDR 225.000",
      action: "Re-sell Item"
    },
    {
      date: "3 days ago",
      status: "Processing",
      title: "Iconic Floor Lamp",
      description: "Purchased from the curated Nocturne set. Currently being verified for quality.",
      price: "IDR 1.250.000",
      action: "Details"
    }
  ],
  listings: [
    {
      title: "Eames Style Lounge",
      label: "Vintage Wood",
      status: "active",
      views: 452,
      price: "$1,200",
      image: "assets/figma-export/44087ad14826697196b8166297cc11af65cda235.jpg"
    },
    {
      title: "Artisan Clay Vase",
      label: "Handmade Ceramic",
      status: "sold",
      views: 128,
      price: "$85",
      image: "assets/figma-export/e9344f4646910949711e30d2ac55ebcace3e4a5b.png"
    },
    {
      title: "Pure Flax Bedding",
      label: "Sustainable Linen",
      status: "active",
      views: 89,
      price: "$210",
      image: "assets/figma-export/753e4f578f1b2c3b27274a49b4b69055d8202c3e.png"
    }
  ]
};
