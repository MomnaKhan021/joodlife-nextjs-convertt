import Image from 'next/image';

const icon1 = "https://s3-alpha-sig.figma.com/img/1332/c477/cae928dd8b08e7669a702d7691775859?Expires=1777852800&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=kCrNYb4fm6vsd444lb1bNH5yCZTUJoLGEy2QRES7y~qbe6AFiqZG97thAXzOVtMCPlpIEmSrLxAZQJcSnbKJvjU-dtQ5Rp4-heNXMh0xKE2ws1rKAlpahtg1Gz15QSnBot92yjU4CThrgx6gJptnKWEE~xifzjwDgjJWJPNAMWQASnakw5mKEIV9eiOf0uszYH0lVJeH8wqZ4s0cmKMObVseuc4X372rDKbBQuTQ4LdFrsKhnJwN5f8gQ7adytMvAQ1Vu~9mu0zdYknNZP6rAibXw-cbMF64i8CaPiQ5qYGwDpZALzBX~AKjL6s3arzoS9zKNoK6SUC00~5eOAv4gQ__";
const icon2 = "https://s3-alpha-sig.figma.com/img/1536/8846/0fcf9811ca6c4258b3d9e12ac557e7bd?Expires=1777852800&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=RWrvKXwlAwIv65Q43V6u6i8dKukgyZu4tclbmQbnUuUJFCq9PbgRy3ZG66BIEdzRgwP6M6POvnZH0Gb4EvFfuc42sJ3tyba-D7j-uatK1v9urcsNv6LIowSuNSWwsTEcvf3FmFlbU6RcKLrqcYk369DI08J4sRWL55eQtS8L6DY5rMYJUelV2RG-ePQ2aE1OG20cto03L3x-90VYm1y3QSd5qIOS4OOAjPaKnQT1F-IxfO4iF4wbxOrIwWcEMZJnVSR27wF95fP0MUCmQjyGgUkCfajyJsHsGX8bYaphV7oyhDE8UIe9ShOimjno4jVhtuzoQcwEt35cWfOMBpII8Q__";
const icon3 = "https://s3-alpha-sig.figma.com/img/16ea/a226/da504dcbfe2297752bce68b24146d2f7?Expires=1777852800&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=JAdjvRRuDn1MAQ9NRgFBrDwFFp3RhyZYjGSzZaPi~2DpiFuGCgLKgxX2tGWc4EjiMOua7PU8WNOSP9Bt6MFCrYF6IAmIH4G5lf3mnS7xrINsXPtIIC-vZ49N6D-MYURJuFVDhfk35eQtcBbJuRzj5VRA62xTGHTjh37y1TqvnssdK58XAV3DqTVDerPgSZom67RRxSUztYpOs10fkpKrxFAc650hYMhpH4o7CH9PnrAXmIeGmFgwaMw~7Rws4d~kaYSTzmXY4Cqjdik-HxWYbnhA8p246lUrsuEf5m36TQq7i0~DtijzE3JfLf89w4YvDd0mA-V4m5UebPTdJ2xLzQ__";
const icon4 = "https://s3-alpha-sig.figma.com/img/1a0f/7e06/b3f9fce9b812b73ebe6f70114a0c7375?Expires=1777852800&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=i~QhUPE2M9QREO51RPVu3WXDvzw9VVTmOgLtJhRZ9x9dbt2wnsK24jRI-q0Uh1thpL~p0rS6Bp8IL7-bKVWS7oRROL~HuygvvFO9wivcLOxdsqRgpfqI3w9nTF5cnzMv97I8mLSB65EVS4KwxwNeth4DU-iL2HFNkS1LFpVoP9dSHPS1AZx~ejdB-~kUzUordp89AuQA6Z~HKiwixZ4c06bmMKeZP6dfK4Fp51Q~7lk7CMAt5bPzRKt-87tQ1e3JYZvYm3FhIYTARMNhcodMqVSHLSTE5-wgr3byT4xOQwcmduozN31~hN07kVDXsSvRrrlZ~MQdOAUqha5IAfv86w__";
const icon5 = "https://s3-alpha-sig.figma.com/img/1dd6/8926/87cebc77d8146600177a59cbe15f491d?Expires=1777852800&Key-Pair-Id=APKAQ4GOSFWCW27IBOMQ&Signature=MYPWCK8EBUDZaQR7yuowvHdBeXouWtoC5EeYIYHee3HswxPs9pVZmR6HSgq7WiJltnwXNQAV9TZMwd3QzyXi2TdLfGtBxO2C5GcSPoP8qJIGePF8myoP8Exn~wvXkq9ag44JUdjnvLvcceQLPSQ-1kZ6hRyXWur9fpyxg1J7PpIpIGTYXQTc7kg6LqKRjAEXoD7vQRq3s03IRBZ9HnRLjQQ5sIs8BBoeA-sQY1UHTNZ6uJb1rCyv5ydWla7PYTeF7IHiAbuHiAc-1dOIp6C72KDzzZPVt1Ga6tv3OoQN~HsSKNr5HI~h8zhvkwOg3Qha1mvR6Yoocw0uZzx62SvUwg__";

const uspItems = [
  { icon: icon1, text: 'UK Licensed medication' },
  { icon: icon2, text: 'Clinically proven' },
  { icon: icon3, text: 'Free next-day delivery' },
  { icon: icon4, text: 'Cancel anytime subscription' },
  { icon: icon5, text: 'Ongoing medical support' },
];

export default function UspBar() {
  // Duplicate items for infinite scroll effect
  const items = [...uspItems, ...uspItems];

  return (
    <section
      className="relative w-full h-[64px] bg-sage overflow-hidden"
    >
      {/* Marquee Container */}
      <div className="flex items-center h-full animate-marquee gap-[65px] px-[65px]">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-[12px] whitespace-nowrap flex-shrink-0"
          >
            <div className="w-[32.4px] h-[32.4px] relative">
              <Image
                src={item.icon}
                alt={item.text}
                fill
                className="object-contain"
              />
            </div>
            <span
              className="text-white font-medium text-[16px]"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
