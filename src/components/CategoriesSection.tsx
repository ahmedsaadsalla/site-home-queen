import Image from "next/image";

const categories = [
  {
    name: "Camas Box",
    href: "/categoria/camas-box",
    image:
      "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Colchões",
    href: "/categoria/colchoes",
    image:
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Cabeceiras",
    href: "/categoria/cabeceiras",
    image:
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Bases",
    href: "/categoria/bases",
    image:
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Baús",
    href: "/categoria/baus",
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Acessórios",
    href: "/categoria/acessorios",
    image:
      "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=600&q=80",
  },
];

export function CategoriesSection() {
  return (
    <section id="categorias" className="scroll-mt-8 bg-[#F5F5F3] pb-8">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-[30px] leading-tight text-[#0F0F10] sm:text-[34px]">
            Encontre o que você precisa
          </h2>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-6">
          {categories.map((category) => (
            <a
              key={category.name}
              href={category.href}
              className="group relative block aspect-[4/5] overflow-hidden rounded-[16px] bg-[#171717]"
            >
              <Image
                src={category.image}
                alt={category.name}
                title={category.name}
                fill
                loading="lazy"
                className="object-cover transition duration-700 ease-out group-hover:scale-110"
                sizes="(max-width: 640px) 50vw, 16vw"
              />
              <div
                className="absolute inset-0 bg-black/25 transition duration-500 group-hover:bg-black/55"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent p-4">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-white">
                  {category.name}
                </h3>
                <span className="mt-2 inline-flex text-[11px] font-semibold text-[#C5A059] transition group-hover:translate-x-1">
                  Ver produtos →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
