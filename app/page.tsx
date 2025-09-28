import ImageToPdfForm from './components/ImageToPdfForm';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center px-4 py-16">
      <ImageToPdfForm />
      <footer className="mt-16 text-center text-sm text-slate-400">
        <p>© {new Date().getFullYear()} ImageFactory · 打造高质量的图像处理体验</p>
      </footer>
    </main>
  );
}
