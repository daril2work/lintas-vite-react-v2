export const handlePrintPlasma = (
    machine: any,
    pData: any,
    rResults: any,
    queueItems: any[],
    selectedItems: Set<string>,
    user: any
) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const instrumentsHtml = queueItems
        .filter(item => selectedItems.has(item.id))
        .map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.room_id || 'CSSD'}</td>
                <td>1</td>
                <td>---</td>
            </tr>
        `).join('');

    const content = `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<title>Formulir Sterilisasi Plasma - ${machine?.name}</title>
<style>
    @page { size: A4 portrait; margin: 1.5cm; }
    body { font-family: 'Arial', sans-serif; font-size: 11px; line-height: 1.4; color: #333; }
    .header { text-align: center; border-bottom: 2px solid #000; margin-bottom: 15px; padding-bottom: 10px; }
    .header h1 { font-size: 14px; margin: 0; text-transform: uppercase; }
    .header h2 { font-size: 16px; margin: 5px 0; border-bottom: 1px solid #000; display: inline-block; padding: 0 20px; }
    
    .section { border: 1px solid #000; margin-bottom: 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; }
    .cell { padding: 5px 10px; border-bottom: 1px solid #eee; }
    .label { font-weight: bold; width: 150px; display: inline-block; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #000; padding: 5px; text-align: left; }
    th { background: #f0f0f0; text-transform: uppercase; font-size: 10px; }
    
    .footer { margin-top: 30px; display: flex; justify-content: flex-end; }
    .sig-box { text-align: center; width: 250px; }
    .sig-space { height: 60px; }
</style>
</head>
<body>
<div class="header">
    <h1>Instalasi Sterilisasi Dan Laundry Sentral - Unit Sterilisasi Sentral</h1>
    <h1>RS Menur</h1>
    <h2>Formulir Proses Sterilisasi Plasma</h2>
</div>

<div class="section">
    <div class="grid">
        <div class="cell"><span class="label">Tanggal:</span> ${new Date().toLocaleDateString('id-ID')}</div>
        <div class="cell"><span class="label">Operator:</span> ${user?.name || '---'}</div>
        <div class="cell"><span class="label">Shift:</span> ${pData.shift}</div>
        <div class="cell"><span class="label">Mesin:</span> ${machine?.name}</div>
    </div>
</div>

<div class="section" style="padding: 10px;">
    <strong>PENGEMASAN & STATUS:</strong><br/>
    Kemasan: ${pData.packaging_type} | Status: ${pData.process_status} | Load: ${pData.load_number}
</div>

<div class="section">
    <div class="grid">
        <div class="cell"><span class="label">Suhu:</span> ${pData.temperature}°C</div>
        <div class="cell"><span class="label">Siklus:</span> ${pData.cycles}</div>
        <div class="cell"><span class="label">Jam Start:</span> ${pData.jam_start}</div>
        <div class="cell"><span class="label">Waktu Steril:</span> ${pData.waktu_steril}</div>
        <div class="cell"><span class="label">End Steril:</span> ${pData.waktu_end_steril}</div>
        <div class="cell"><span class="label">Lama Steril:</span> ${pData.lama_steril} Menit</div>
    </div>
</div>

<div class="section" style="padding: 10px;">
    <strong>HASIL INDIKATOR:</strong><br/>
    Internal: ${rResults.indicator_internal} | Eksternal: ${rResults.indicator_external}<br/>
    Biologi (Kontrol): ${rResults.indicator_biological_control} | Biologi (Uji): ${rResults.indicator_biological_test}<br/>
    <strong>HASIL AKHIR: ${rResults.result.toUpperCase()}</strong>
</div>

<table>
    <thead>
        <tr>
            <th>Nama Instrumen</th>
            <th>Asal Barang</th>
            <th>Jml</th>
            <th>Berat</th>
        </tr>
    </thead>
    <tbody>
        ${instrumentsHtml}
    </tbody>
</table>

<div style="margin-top: 15px;">
    <strong>KENDALA:</strong> ${pData.notes || '---'}
</div>

<div class="footer">
    <div class="sig-box">
        <p>Koordinator Mutu</p>
        <div class="sig-space"></div>
        <p><strong>Apt. Amilatus Sholikha, S.Farm</strong></p>
        <p>NIP. 19841020 201903 2009</p>
    </div>
</div>

<script>window.print();</script>
</body>
</html>`;
    printWindow.document.write(content);
    printWindow.document.close();
};

export const handlePrintSteam = (
    machine: any,
    sData: any,
    rResults: any,
    queueItems: any[],
    selectedItems: Set<string>,
    user: any
) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const instrumentsHtml = queueItems
        .filter(item => selectedItems.has(item.id))
        .map(item => `
            <tr>
                <td>${item.name}</td>
                <td>${item.room_id || 'CSSD'}</td>
                <td>1</td>
                <td>---</td>
            </tr>
        `).join('');

    const content = `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<title>Formulir Sterilisasi STEAM - ${machine?.name}</title>
<style>
    @page { size: A4 portrait; margin: 1.5cm; }
    body { font-family: 'Arial', sans-serif; font-size: 11px; line-height: 1.4; color: #333; }
    .header { text-align: center; border-bottom: 2px solid #000; margin-bottom: 15px; padding-bottom: 10px; }
    .header h1 { font-size: 14px; margin: 0; text-transform: uppercase; }
    .header h2 { font-size: 16px; margin: 5px 0; border-bottom: 1px solid #000; display: inline-block; padding: 0 20px; }
    
    .section { border: 1px solid #000; margin-bottom: 10px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; }
    .cell { padding: 5px 10px; border-bottom: 1px solid #eee; }
    .label { font-weight: bold; width: 150px; display: inline-block; }
    
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #000; padding: 5px; text-align: left; }
    th { background: #f0f0f0; text-transform: uppercase; font-size: 10px; }
    
    .footer { margin-top: 30px; display: flex; justify-content: flex-end; }
    .sig-box { text-align: center; width: 250px; }
    .sig-space { height: 60px; }
</style>
</head>
<body>
<div class="header">
    <h1>Instalasi Sterilisasi Dan Laundry Sentral - Unit Sterilisasi Sentral</h1>
    <h1>RS Menur</h1>
    <h2>Formulir Proses Sterilisasi STEAM</h2>
</div>

<div class="section">
    <div class="grid">
        <div class="cell"><span class="label">Tanggal:</span> ${new Date().toLocaleDateString('id-ID')}</div>
        <div class="cell"><span class="label">Operator:</span> ${user?.name || '---'}</div>
        <div class="cell"><span class="label">Shift:</span> ${sData.shift}</div>
        <div class="cell"><span class="label">Mesin:</span> ${machine?.name}</div>
    </div>
</div>

<div class="section" style="padding: 10px;">
    <strong>PENGEMASAN & STATUS:</strong><br/>
    Kemasan: ${sData.packaging_type} | Status: ${sData.process_status} | Load: ${sData.load_number} | Program: ${sData.program_temp}°C
</div>

<div class="section">
    <div class="grid">
        <div class="cell"><span class="label">Siklus:</span> ${sData.cycles}</div>
        <div class="cell"><span class="label">Jam Start:</span> ${sData.jam_start}</div>
        <div class="cell"><span class="label">Waktu Steril:</span> ${sData.waktu_steril}</div>
        <div class="cell"><span class="label">End Steril:</span> ${sData.waktu_end_steril}</div>
        <div class="cell"><span class="label">Lama Steril:</span> ${sData.lama_steril} Menit</div>
        <div class="cell"><span class="label">Lama Proses:</span> ${sData.lama_proses} Menit</div>
    </div>
</div>

<div class="section" style="padding: 10px;">
    <strong>HASIL INDIKATOR:</strong><br/>
    Eksternal: ${rResults.indicator_external} | Class 4: ${rResults.indicator_chemical_class_4} | Class 5: ${rResults.indicator_chemical_class_5}<br/>
    Biologi (Kontrol): ${rResults.indicator_biological_control} | Biologi (Uji): ${rResults.indicator_biological_test}<br/>
    <strong>HASIL AKHIR: ${rResults.result.toUpperCase()}</strong>
</div>

<table>
    <thead>
        <tr>
            <th>Nama Instrumen</th>
            <th>Asal Barang</th>
            <th>Jml</th>
            <th>Berat</th>
        </tr>
    </thead>
    <tbody>
        ${instrumentsHtml}
    </tbody>
</table>

<div style="margin-top: 15px;">
    <strong>KENDALA:</strong> ${sData.notes || '---'}
</div>

<div class="footer">
    <div class="sig-box">
        <p>Koordinator Mutu</p>
        <div class="sig-space"></div>
        <p><strong>Apt. Amilatus Sholikha, S.Farm</strong></p>
        <p>NIP. 19841020 201903 2009</p>
    </div>
</div>

<script>window.print();</script>
</body>
</html>`;
    printWindow.document.write(content);
    printWindow.document.close();
};
