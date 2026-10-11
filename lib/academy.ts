const firstFifteenDays = [
  "tools and sections knowledge and blow drying",
  "Creemping",
  "types of curls",
  "Bridal bun",
  "Messy bun",
  "High messi bun with slick front",
  "small curls with twisted front",
  "voluminous curls keeping all hair infront",
  "loose curls with ribs in front",
  "simple Hollywood Waves",
  "Practice day",
  "Half pony",
  "Full pony",
  "French bun",
  "messy bun using tiny 9mm rod",
];

export const academyCourses = [
  { days: 15, title: "15 Days Professional Hairstyling Class", lessons: firstFifteenDays },
  { days: 30, title: "30 Days Professional Hairstyling Class", lessons: [
    ...firstFifteenDays,
    "curls with braided front coming back",
    "messy bun using braids",
    "mermaid hair",
    "beachy waves",
    "advanced Hollywood waves",
    "Practice day",
    "blow dry setting",
    "curls with straightener",
    "curling style for long hair",
    "bun for bob cuts",
    "half up hairstyle",
    "low messy bun",
    "Vintage hair",
    "Full demonstration on bridal hair (sir bind flowers, vail, and other hair accessories)",
    "Practice day",
  ] },
];


export const nailCourses = [
  { days: 6, title: "6 Days Basic Nails Course", lessons: [
    "Gel nail extensions", "Line arts", "Dot arts", "French arts", "Cow print", "Animal print", "Stone application", "Flowers print", "Refill",
  ] },
  { days: 15, title: "15 Days Professional Nails Course", lessons: [
    "20+ nail arts", "Blooming marble", "Line marble", "Spider gel", "Stickers application", "Tape application", "Chrome arts/design", "Leaf arts", "Gel nail extension", "Refills", "Remove", "Gel X",
  ] },
  { days: 30, title: "30 Days Master Nails Course", lessons: [
    "Nail theory", "Tools knowledge and techniques", "Nail shaping", "Gel overlay", "Acrylic overlay", "Gel nail extension", "Acrylic nail extension", "Nail extension removal", "Gel nail colour change", "Refill technique", "Nail Polish application technique", "50+ nail art", "Cateye", "Mix marble", "Different marble art", "Hand model Examination", "Blooming art", "French nail technique", "Stone application", "3d flower", "Lace art", "Colour pigment art", "In glitter", "Sea shell design", "Acrylic nail examination", "Sculpture nail extension",
    "Polygel nail extension", "Toe nail extension", "Gel x extension", "Press on nail ideas", "3d chrome design", "Colour pigment art", "Sweater nail art", "Zebra nail art", "Animal print", "Leaf art", "Fire art", "Flame art", "Use of ombre machine", "Glitter ombre", "Butterfly art", "Ora nail", "Eyeshadow ombre nail", "Glitter and sugar dust", "Different types of flower design", "Practice on handmodel", "Summer nail art", "Tape application", "Evil eye art", "Examination day", "Certificate and portfolio",
  ] },
];


export const allAcademyCourses = [
  ...academyCourses.map((course, index) => ({ ...course, slug: `${course.days}-day-hairstyling`, category: "hair" as const, price: [15000, 25000][index] })),
  ...nailCourses.map((course, index) => ({ ...course, slug: ["6-day-basic-nails", "15-day-professional-nails", "30-day-master-nails"][index], category: "nails" as const, price: [6000, 15000, 30000][index] })),
];
export function findAcademyCourse(slug: string) { return allAcademyCourses.find(course => course.slug === slug); }
