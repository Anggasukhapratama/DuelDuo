# 🎮 Gesture Games

Game multiplayer berbasis deteksi tangan menggunakan webcam! Dua game seru yang bisa dimainkan berdua.

## 🌟 Fitur Game

### 1. 👊 Punch Battle
- Layar split screen untuk 2 pemain
- Deteksi gerakan tangan menggunakan MediaPipe
- Target muncul secara random
- Pukul target sebanyak-banyaknya dalam waktu 60 detik
- Sistem scoring real-time

### 2. 🧮 Math Quiz Battle
- Layar split screen untuk 2 pemain
- Soal matematika (penjumlahan, pengurangan, perkalian)
- 3 pilihan jawaban (pilihan ganda)
- Jawab dengan menunjuk menggunakan tangan (hover detection)
- Jawaban benar → hijau ✅
- Jawaban salah → merah ❌
- Timer 2 menit

## 🎨 Color Scheme
- **Primary**: #ECFAE5 (Light Mint)
- **Secondary**: #DDF6D2 (Soft Green)
- **Accent**: #CAE8BD (Pale Green)

## 🚀 Cara Menjalankan

### Development
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Build untuk Production
```bash
# Build project
npm run build

# Preview production build
npm run preview
```

## 📦 Deploy ke Vercel

### Cara 1: Via CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Cara 2: Via Git
1. Push project ke GitHub
2. Import di [Vercel Dashboard](https://vercel.com/new)
3. Framework Preset: **Vite**
4. Deploy!

## 🎮 Cara Main

### Punch Battle
1. Klik "Mulai Game"
2. Izinkan akses webcam
3. Gerakan tangan kamu akan terdeteksi
4. Pukul target yang muncul menggunakan jari telunjuk
5. Kumpulkan poin sebanyak-banyaknya!

### Math Quiz Battle
1. Klik "Mulai Game"
2. Izinkan akses webcam
3. Baca soal matematika yang muncul
4. Tunjuk jawaban yang benar dengan tangan (hover 0.8 detik)
5. Jawab sebanyak mungkin dalam waktu yang ditentukan!

## 🛠️ Teknologi yang Digunakan

- **Vite** - Build tool & dev server
- **MediaPipe Hands** - Hand tracking & gesture detection
- **Vanilla JavaScript** - Pure JS, no framework overhead
- **HTML5 Canvas** - Rendering & animations
- **CSS3** - Styling & animations

## 📱 Browser Support

Game ini memerlukan:
- ✅ Browser modern (Chrome, Edge, Firefox)
- ✅ Akses webcam
- ✅ HTTPS atau localhost (untuk akses webcam)

## 🎯 Game Controls

### Punch Battle
- **Jari telunjuk** = Pointer untuk memukul target

### Math Quiz Battle
- **Posisi tangan atas** = Pilihan 1
- **Posisi tangan tengah** = Pilihan 2
- **Posisi tangan bawah** = Pilihan 3
- Hover 0.8 detik untuk memilih jawaban

## 📝 License

MIT

## 🤝 Contributing

Feel free to submit issues and pull requests!

---

Made with 💚 using MediaPipe & Vite
