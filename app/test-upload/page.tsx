"use client";

export default function TestUpload() {
  async function testUpload() {
    const response = await fetch("/test.jpg");
    const blob = await response.blob();

    const reader = new FileReader();

    reader.onloadend = async () => {
      const upload = await fetch("/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          file: reader.result,
          folder: "miori-booth/test",
          resourceType: "image",
        }),
      });

      const result = await upload.json();
      console.log(result);

      alert(result.success ? result.url : result.message);
    };

    reader.readAsDataURL(blob);
  }

  return (
    <main className="min-h-screen flex items-center justify-center">
      <button
        onClick={testUpload}
        className="px-8 py-4 rounded-xl bg-blue-600 text-white font-bold"
      >
        Test Upload Cloudinary
      </button>
    </main>
  );
}