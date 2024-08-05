document.getElementById('fileInput').addEventListener('change', handleFile, false);

function handleFile(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('error').style.display = 'none';
            JSZip.loadAsync(e.target.result)
                .then(zip => processZip(zip))
                .catch(error => {
                    document.getElementById('error').textContent = 'Ошибка загрузки архива';
                    document.getElementById('error').style.display = 'block';
                    document.getElementById('loading').style.display = 'none';
                });
        };
        reader.readAsArrayBuffer(file);
    }
}

async function processZip(zip) {
    const textFile = zip.file(/\.txt$/)[0];
    const imageFiles = zip.file(/\.jpg$|\.png$/);
    const pdfFiles = zip.file(/\.pdf$/);
    const opusFiles = zip.file(/\.opus$/);

    if (textFile) {
        const text = await textFile.async('text');
        const lines = text.split('\n');
        const chatContainer = document.getElementById('chat');
        chatContainer.innerHTML = '';
        let previousSender = '';
        const senderNames = new Set();

        lines.forEach(line => {
            if (line.trim()) {
                const message = parseLine(line);
                if (message) {
                    senderNames.add(message.sender);
                }
            }
        });

        const [firstSender, secondSender] = Array.from(senderNames);

        lines.forEach(line => {
            if (line.trim()) {
                const message = parseLine(line);
                if (message) {
                    const messageElement = createMessageElement(message, firstSender, secondSender, imageFiles, pdfFiles, opusFiles);
                    chatContainer.appendChild(messageElement);
                }
            }
        });
    }

    document.getElementById('loading').style.display = 'none';
}

function parseLine(line) {
    const regex = /^(\d{2}\.\d{2}\.\d{4}, \d{2}:\d{2}) - (.*?): (.*)$/;
    const match = line.match(regex);

    if (!match) return null;

    const timestamp = match[1];
    const sender = match[2].trim();
    const message = match[3].trim();

    return { timestamp, sender, message };
}

function createMessageElement(message, firstSender, secondSender, imageFiles, pdfFiles, opusFiles) {
    const messageElement = document.createElement('div');
    messageElement.className = 'message ' + (message.sender === firstSender ? 'sent' : 'received');

    const sender = document.createElement('div');
    sender.className = 'sender';
    sender.textContent = message.sender;

    const content = document.createElement('div');
    content.className = 'content';

    const imageNameMatch = message.message.match(/\b(\S+\.(jpg|png))\b/i);
    if (imageNameMatch) {
        const imageName = imageNameMatch[0];
        const imageFile = imageFiles.find(file => file.name === imageName);
        if (imageFile) {
            imageFile.async('base64').then(fileData => {
                const imgElement = document.createElement('img');
                imgElement.src = `data:image/${imageName.split('.').pop()};base64,${fileData}`;
                imgElement.className = 'clickable-image';
                imgElement.onclick = () => openModal(imgElement.src);
                content.appendChild(imgElement);
            });
        }
        message.message = message.message.replace(imageName, '').trim();
    }

    const pdfNameMatch = message.message.match(/\b(\S+\.pdf)\b/i);
    if (pdfNameMatch) {
        const pdfName = pdfNameMatch[0];
        const pdfFile = pdfFiles.find(file => file.name === pdfName);
        if (pdfFile) {
            const pdfLink = document.createElement('a');
            pdfLink.href = '#';
            pdfLink.className = 'file-link';
            pdfLink.textContent = pdfName;
            pdfLink.onclick = () => downloadPdf(pdfFile);
            content.appendChild(pdfLink);
        }
        message.message = message.message.replace(pdfName, '').trim();
    }

    const opusNameMatch = message.message.match(/\b(\S+\.opus)\b/i);
    if (opusNameMatch) {
        const opusName = opusNameMatch[0];
        const opusFile = opusFiles.find(file => file.name === opusName);
        if (opusFile) {
            opusFile.async('blob').then(blob => {
                const audioElement = document.createElement('audio');
                audioElement.controls = true;
                audioElement.src = URL.createObjectURL(blob);
                content.appendChild(audioElement);
            });
        }
        message.message = message.message.replace(opusName, '').trim();
    }

    if (message.message.includes('(файл добавлен)')) {
        const fileLink = document.createElement('a');
        fileLink.href = '#';
        fileLink.className = 'file-link';
        fileLink.textContent = message.message.replace('(файл добавлен)', '').trim();
        content.appendChild(fileLink);
    } else {
        const urlRegex = /https?:\/\/[^\s]+/g;
        const parts = message.message.split(urlRegex);
        let match;
        content.appendChild(document.createTextNode(parts.shift()));
        while (match = urlRegex.exec(message.message)) {
            const link = document.createElement('a');
            link.href = match[0];
            link.className = 'link';
            link.textContent = match[0];
            link.target = '_blank';
            content.appendChild(link);
            content.appendChild(document.createTextNode(parts.shift()));
        }
    }

    messageElement.appendChild(sender);
    messageElement.appendChild(content);

    return messageElement;
}

function openModal(src) {
    const modal = document.createElement('div');
    modal.className = 'modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    const img = document.createElement('img');
    img.src = src;
    modalContent.appendChild(img);

    const closeButton = document.createElement('span');
    closeButton.className = 'close';
    closeButton.textContent = '×';
    closeButton.onclick = () => closeModal(modal);
    modalContent.appendChild(closeButton);

    modal.appendChild(modalContent);
    document.body.appendChild(modal);
}

function closeModal(modal) {
    document.body.removeChild(modal);
}

function downloadPdf(pdfFile) {
    pdfFile.async('blob').then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfFile.name;
        a.click();
        URL.revokeObjectURL(url);
    });
}
