const chooseBtn = document.getElementById("chooseBtn");
const encryptBtn = document.getElementById("encryptBtn");
const imageInput = document.getElementById("imageInput");
const statusDiv = document.getElementById("status");
let selectedFiles = [];

chooseBtn.addEventListener("click", () => {
  imageInput.click();
});

imageInput.addEventListener("change", (event) => {
  selectedFiles = Array.from(event.target.files);
  if (selectedFiles.length > 0) {
    encryptBtn.disabled = false;
    statusDiv.innerText = `✅ تم اختيار ${selectedFiles.length} صورة`;
  }
});

encryptBtn.addEventListener("click", async () => {
  if (selectedFiles.length === 0) return;

  let zip = new JSZip();
  let includeTxt = "";
  let createTextureTxt = "";
  let textureInfoH = "";

  for (let file of selectedFiles) {
    let arrayBuffer = await file.arrayBuffer();
    let bytes = new Uint8Array(arrayBuffer);

    // تحويل البايتات لهيكس 16 في السطر
    let hexLines = [];
    for (let i = 0; i < bytes.length; i += 16) {
      let slice = bytes.slice(i, i + 16);
      hexLines.push(
        Array.from(slice).map(b => "0x" + b.toString(16).padStart(2,"0")).join(", ") + ","
      );
    }

    let fileName = file.name.replace(".png", "");
    let variableName = `${fileName}_data`;
    let headerContent = `unsigned char ${variableName}[] = {
${hexLines.join("\n")}
};

`;

    // إضافة ملف .h
    zip.file(`${fileName}.h`, headerContent);

    includeTxt += `#include "${fileName}.h"\n`;
    createTextureTxt += `${fileName} = CreateTexture(${variableName}, sizeof(${variableName}));\n`;
    textureInfoH += `extern TextureInfo ${fileName};\nTextureInfo ${fileName};\n`;
  }

  // ملفات إضافية
  zip.file("include.txt", includeTxt);
  zip.file("createtexture.txt", createTextureTxt);
  zip.file("TextureInfo.h", textureInfoH);

  // تنزيل ملف zip
  zip.generateAsync({ type: "blob" }).then(content => {
    let link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "encrypted_images.zip";
    link.click();
  });

  statusDiv.innerText = "📂 تم التشفير والحفظ في ملف مضغوط!";
});