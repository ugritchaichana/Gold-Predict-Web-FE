# Gold Predict Web FE

Frontend สำหรับแสดงกราฟราคาทองคำ, ข้อมูล USD/THB และข้อมูลการพยากรณ์ สร้างด้วย React + Vite

## เทคโนโลยีหลัก

- React 18
- Vite 4
- Tailwind CSS
- Axios
- i18next

## ข้อกำหนดก่อนเริ่ม

- Node.js เวอร์ชัน 18+ (แนะนำ LTS)
- pnpm (โปรเจกต์นี้ใช้ `pnpm-lock.yaml`)

> แนะนำให้เปิดใช้ Corepack ก่อนติดตั้ง pnpm

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

## วิธีติดตั้งและรันโปรเจกต์

1) โคลนโปรเจกต์และเข้าโฟลเดอร์

```bash
git clone https://github.com/ugritchaichana/Gold-Predict-Web-FE.git
cd Gold-Predict-Web-FE
```

2) ติดตั้ง dependencies

```bash
pnpm install
```

3) สร้างไฟล์ `.env` ที่ root ของโปรเจกต์

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/
```

หมายเหตุ:
- ค่า `VITE_API_BASE_URL` จะถูกใช้เป็น Base URL ของ API
- ถ้าไม่กำหนด ระบบจะ fallback ไปที่ `http://127.0.0.1:8000/`

4) รันโหมดพัฒนา

```bash
pnpm dev
```

จากนั้นเปิดเบราว์เซอร์ที่ URL ที่ Vite แสดงในเทอร์มินัล (ปกติคือ `http://localhost:5173`)

## คำสั่งที่ใช้บ่อย

```bash
# เริ่มพัฒนา
pnpm dev

# build production
pnpm build

# build แบบ development mode
pnpm build:dev

# build แบบ production mode
pnpm build:prod

# preview ไฟล์ที่ build แล้ว
pnpm preview

# lint
pnpm lint
```

## การ build และ deploy (Firebase Hosting)

โปรเจกต์ตั้งค่าให้ deploy โฟลเดอร์ `dist` ไปที่ Firebase Hosting แล้ว (`firebase.json`)

1) build ไฟล์

```bash
pnpm build
```

2) deploy

```bash
firebase deploy
```

## โครงสร้างโฟลเดอร์หลัก

```text
src/
	components/     # UI และหน้าใช้งานหลัก
	Page/           # ส่วนหน้าขนาดใหญ่แยกตามโดเมน
	services/       # เรียก API
	config/         # ค่าคอนฟิก เช่น API base URL
	i18n/           # ภาษา (en/th)
	styles/         # global/custom styles
```

## ปัญหาที่พบบ่อย

- เปิดหน้าเว็บได้แต่ข้อมูลไม่ขึ้น
	- ตรวจว่า backend API ทำงานอยู่
	- ตรวจค่า `VITE_API_BASE_URL` ใน `.env`
	- รีสตาร์ท dev server หลังแก้ `.env`

- ติดตั้งแพ็กเกจไม่ได้
	- ตรวจเวอร์ชัน Node.js ให้เป็น 18+
	- รัน `corepack enable` แล้วลอง `pnpm install` ใหม่

---
