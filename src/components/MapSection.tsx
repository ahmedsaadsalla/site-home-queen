export function MapSection() {
  return (
    <section className="bg-white py-10">
      <div className="mx-auto max-w-[1240px] px-6 lg:px-8">
        <h2 className="font-display text-[24px] sm:text-[28px]">Mapa</h2>

        <div className="mt-4 grid items-stretch gap-4 lg:grid-cols-2">
          <div className="overflow-hidden rounded-[14px] border border-[#EAEAEA] bg-white shadow-[0_6px_20px_rgba(15,15,16,0.05)]">
            <iframe
              title="Mapa Home Queen"
              className="h-[200px] w-full lg:h-full lg:min-h-[220px]"
              src="https://maps.google.com/maps?q=Chapec%C3%B3%20SC&t=&z=13&ie=UTF8&iwloc=&output=embed"
              loading="lazy"
            />
          </div>

          <div className="flex flex-col justify-center gap-3.5 rounded-[14px] border border-[#EAEAEA] bg-white p-5 shadow-[0_6px_20px_rgba(15,15,16,0.05)] sm:p-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C5A059]">
                Endereço
              </p>
              <p className="mt-1.5 text-[13px] leading-6 text-[#2E2E2E]">
                Rodovia SC-480, 1234
                <br />
                Bairro Industrial — Chapecó/SC
                <br />
                CEP 89801-970
              </p>
            </div>

            <div className="h-px bg-[#EAEAEA]" />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C5A059]">
                Contatos
              </p>
              <p className="mt-1.5 text-[13px] leading-6 text-[#2E2E2E]">
                Telefone:{" "}
                <a href="tel:+5531999999999" className="transition hover:text-[#C5A059]">
                  (31) 99999-9999
                </a>
                <br />
                WhatsApp:{" "}
                <a
                  href="https://wa.me/5531999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-[#C5A059]"
                >
                  (31) 99999-9999
                </a>
              </p>
            </div>

            <div className="h-px bg-[#EAEAEA]" />

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C5A059]">
                E-mail
              </p>
              <p className="mt-1.5 text-[13px] leading-6 text-[#2E2E2E]">
                <a
                  href="mailto:contato@homequeen.com.br"
                  className="transition hover:text-[#C5A059]"
                >
                  contato@homequeen.com.br
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
