// Utility to register Times New Roman into a jsPDF instance.
// Returns true if registration succeeded, false otherwise.
export async function registerTNR(doc) {
  if (typeof window !== 'undefined' && window.__TNRRegistered) return true;

  const toBase64 = (ab) => {
    let binary = '';
    const bytes = new Uint8Array(ab);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return window.btoa(binary);
  };

  const loadFont = async (url, fontId, style) => {
    const resp = await fetch(encodeURI(url));
    if (!resp.ok) throw new Error(`Font not found: ${url}`);
    const ab = await resp.arrayBuffer();
    const b64 = toBase64(ab);
    const filename = `${fontId}-${style}.ttf`;
    doc.addFileToVFS(filename, b64);
    try {
      doc.addFont(filename, fontId, style, 'Identity-H');
    } catch (e) {
      doc.addFont(filename, fontId, style);
    }
  };

  try {
    // Try common filenames from public/fonts — adjust if you use different names.
    await loadFont('/fonts/times new roman.ttf', 'TNR', 'normal');
    await loadFont('/fonts/times new roman bold.ttf', 'TNR', 'bold');

    // quick verification
    try {
      doc.setFont('TNR', 'normal');
      const sample = 'áàảãạâăêơưđ';
      const width = typeof doc.getTextWidth === 'function' ? doc.getTextWidth(sample) : doc.getStringUnitWidth(sample);
      if (!Number.isFinite(width) || width <= 0) throw new Error('invalid width');
    } catch (err) {
      console.warn('TNR registration verification failed', err);
      return false;
    }

    if (typeof window !== 'undefined') window.__TNRRegistered = true;
    return true;
  } catch (err) {
    console.warn('Could not register TNR fonts:', err);
    return false;
  }
}
