export default function AboutUs() {
  return (
    <div className="!pb-(--space-l) px-(--space-m) py-(--space-s) max-w-[1024px] mx-auto">
      <header className="mb-(--space-l)">
        <h1 className="text-6 font-bold text-maroon">เกี่ยวกับ CarJai</h1>
      </header>

      <section className="mb-(--space-l)">
        <p className="text-grey text--1">
          CarJai คือแพลตฟอร์มซื้อขายรถยนต์มือสองที่
          <span className="font-bold"> ง่าย โปร่งใส และน่าเชื่อถือ </span>
          ที่สุดในประเทศไทย เราเชื่อมต่อเจ้าของรถที่ต้องการขายอย่างรวดเร็ว
          เข้ากับผู้ซื้อที่ต้องการข้อมูลที่โปร่งใสและเชื่อถือได้
        </p>
      </section>

      <section className="mb-(--space-l)">
        <h2 className="text-2 font-bold text-grey mb-(--space-xs)">
          ภารกิจของเรา
        </h2>
        <p className="text-grey text--1 mb-(--space-xs)">
          เราตั้งใจทำให้การซื้อ-ขายรถยนต์มือสองในประเทศไทยเป็นเรื่องที่ง่าย
          ปลอดภัย และโปร่งใส ลดปัญหาที่เจ้าของรถและผู้ซื้อเจอทุกวัน:
        </p>
        <ul className="list-disc pl-6 text-grey text--1 grid gap-(--space-2xs)">
          <li>ประกาศที่ไม่น่าเชื่อถือ</li>
          <li>ดีลที่ซับซ้อนและไม่ยุติธรรม</li>
          <li>ข้อมูลที่ไม่ครบถ้วนและไม่สม่ำเสมอ</li>
        </ul>
      </section>

      <section className="mb-(--space-l)">
        <h2 className="text-2 font-bold text-grey mb-(--space-xs)">
          ทำไมชื่อ &quot;CarJai&quot;?
        </h2>
        <p className="text-grey text--1">
          ชื่อ <span className="font-bold">CarJai</span>{" "}
          เกิดจากการผสมผสานระหว่าง
          <span className="font-bold"> Car </span>(รถ) และ{" "}
          <span className="font-bold">&quot;ใจ&quot;</span> ในภาษาไทย
        </p>
        <ul className="list-none mt-(--space-xs) text-grey text--1 grid gap-(--space-2xs)">
          <li>🚗 Car = รถยนต์ที่เป็นใจกลางของธุรกิจ</li>
          <li>❤️ ใจ = ความจริงใจ ความโปร่งใส และความไว้ใจ</li>
        </ul>
        <p className="text-grey text--1 mt-(--space-xs)">
          เพราะเราเชื่อมั่นว่า{" "}
          <span className="font-bold">ความเชื่อใจคือสิ่งสำคัญที่สุด</span>{" "}
          ในการซื้อขายรถยนต์มือสอง
        </p>
      </section>

      <section className="mb-(--space-l)">
        <h2 className="text-2 font-bold text-grey mb-(--space-xs)">
          CarJai ไม่ใช่แค่แพลตฟอร์มประกาศขายรถทั่วไป
        </h2>
        <div className="grid gap-(--space-m) md:grid-cols-2">
          <div>
            <h3 className="font-bold text-grey mb-(--space-2xs)">
              สำหรับผู้ขาย
            </h3>
            <ul className="list-disc pl-6 text-grey text--1 grid gap-(--space-2xs)">
              <li>
                ✅ ลงประกาศด้วยความมั่นใจ
                ว่าข้อมูลและเอกสารจะถูกนำเสนออย่างโปร่งใส
              </li>
              <li>✅ เข้าถึงผู้ซื้อจริงจัง ที่พร้อมตัดสินใจ</li>
              <li>✅ ขายได้เร็วกว่า ด้วยระบบที่เชื่อถือได้</li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-grey mb-(--space-2xs)">
              สำหรับผู้ซื้อ
            </h3>
            <ul className="list-disc pl-6 text-grey text--1 grid gap-(--space-2xs)">
              <li>✅ ตัดสินใจด้วยความสบายใจ เพราะข้อมูลชัดเจนและตรวจสอบได้</li>
              <li>✅ ติดต่อผู้ขายได้โดยตรง โดยไม่ต้องผ่านคนกลาง</li>
              <li>✅ มั่นใจในทุกการซื้อ ด้วยระบบที่โปร่งใส</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mb-(--space-l)">
        <h2 className="text-2 font-bold text-grey mb-(--space-xs)">
          วิสัยทัศน์ของเรา
        </h2>
        <blockquote className="border-l-4 border-red pl-(--space-s) text-grey italic text--1">
          &quot;เป็นแพลตฟอร์มที่ใส่หัวใจของผู้ซื้อและผู้ขายเป็นศูนย์กลางของทุกการซื้อขาย&quot;
        </blockquote>
        <p className="text-grey text--1 mt-(--space-s)">
          เราทำให้ทุกดีลเกิดขึ้นอย่าง:
        </p>
        <ul className="list-disc pl-6 text-grey text--1 grid gap-(--space-2xs) mt-(--space-2xs)">
          <li>
            <span className="font-bold">ยุติธรรม</span> -
            ไม่มีการหลอกลวงหรือซ่อนข้อมูล
          </li>
          <li>
            <span className="font-bold">โปร่งใส</span> - ข้อมูลครบถ้วน
            ตรวจสอบได้ทุกขั้นตอน
          </li>
          <li>
            <span className="font-bold">น่าเชื่อถือ</span> -
            ระบบรักษาความปลอดภัยระดับสูง
          </li>
        </ul>
      </section>

      <footer className="mt-(--space-xl)">
        <p className="text-grey text--1 font-bold">
          CarJai - ใส่ใจในทุกการซื้อขาย เชื่อใจในทุกดีล
        </p>
      </footer>
    </div>
  );
}
