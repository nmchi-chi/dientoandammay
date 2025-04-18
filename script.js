const chatBox = document.querySelector('.chat-box');
const docsBox = document.querySelector('.docs-box');
const billingBox = document.querySelector('.billing-box');
const chatWindow = document.getElementById('chatWindow');
let socket;

let name = prompt("Xin chào, cho mình biết tên để tiện xưng hô nhé!");

if (name) {
  initializeWebSocket(name);
}

function initializeWebSocket(name) {
  socket = new WebSocket(`ws://34.143.139.189:8080/api/v1/chat/ws?name=${name}`);
  let botMessageBuffer = ''; 
  let botTimeout;
  
  socket.onmessage = function(event) {
    let message = event.data;
  
    if (message.includes('__end__')) {
      message = message.replace('__end__', '');
    }
  
    botMessageBuffer += message;
  
    clearTimeout(botTimeout);
  
    botTimeout = setTimeout(() => {
      appendMessage('🤖 Bot', botMessageBuffer.trim());
      botMessageBuffer = ''; 
    }, 300);
  };
  
  socket.onerror = function(error) {
    console.error("WebSocket Error: ", error);
  };

  socket.onopen = function() {
    console.log("WebSocket connection established!");
  };

  socket.onclose = function() {
    console.log("WebSocket connection closed.");
  };
}



function sendMessage() {
  const input = document.getElementById('chatInput');
  const msg = input.value;
  if (!msg) return;
  appendMessage('🙋 You', msg);
  socket.send(msg);
  input.value = '';
}

function appendMessage(sender, text) {
    const p = document.createElement('p');
    // Xác định class dựa trên sender
    const isUser = sender.includes('You');
    p.classList.add('chat-message', isUser ? 'user' : 'bot');
    p.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatWindow.appendChild(p);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.chat-box, .docs-box, .billing-box').forEach(c => c.classList.add('hidden'));

  if (tab === 'chat') {
    chatBox.classList.remove('hidden');
    document.querySelector('.tab:nth-child(1)').classList.add('active');
  } else if (tab === 'docs') {
    docsBox.classList.remove('hidden');
    document.querySelector('.tab:nth-child(2)').classList.add('active');
    loadDocs();
  } else {
    billingBox.classList.remove('hidden');
    document.querySelector('.tab:nth-child(3)').classList.add('active');
    loadBilling();
  }
}

async function loadDocs() {
  const res = await fetch('http://34.143.139.189:8080/api/v1/document');
  const data = await res.json();
  const tbody = document.getElementById('docsTable');
  tbody.innerHTML = '';
  data.data.forEach(doc => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${doc.id}</td>
      <td>${doc.product_name}</td>
      <td>${doc.short_description}</td>
      <td><a href="${doc.source_file}" target="_blank">🔗 Link</a></td>
      <td><button onclick="deleteDoc(${doc.id})">🗑️ Delete</button></td>
    `;
    tbody.appendChild(tr);
  });
}

async function uploadFile() {
  const input = document.getElementById('uploadFile');
  const file = input.files[0];
  if (!file) return alert('Please select a file');
  const formData = new FormData();
  formData.append('file', file);
  await fetch('http://34.143.139.189:8080/api/v1/document', {
    method: 'POST',
    body: formData
  });
  loadDocs();
  input.value = '';
}

async function deleteDoc(id) {
  await fetch(`http://34.143.139.189:8080/api/v1/document/${id}`, { method: 'DELETE' });
  loadDocs();
}

async function loadBilling() {
    const day = '2025-04-01';
  
    const [gcpBilling, awsBilling, s3Buckets, gcpServices] = await Promise.all([
      fetch(`http://34.143.139.189:8080/api/v1/gcp/billing?start_time=${day}`).then(res => res.json()),
      fetch(`http://34.143.139.189:8080/api/v1/aws/billing?start_time=${day}`).then(res => res.json()),
      fetch(`http://34.143.139.189:8080/api/v1/aws/s3/bucket?start_time=${day}`).then(res => res.json()),
      fetch(`http://34.143.139.189:8080/api/v1/gcp/services?start_time=${day}`).then(res => res.json())
    ]);
  
    const billingDiv = document.getElementById('billingData');
    billingDiv.innerHTML = `
      <style>
        .pretty-table {
          border-collapse: collapse;
          width: 100%;
          margin: 15px 0;
          font-size: 16px;
          font-family: 'Segoe UI', sans-serif;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        }
        .pretty-table th {
          background-color: #DDF2F4; /* pastel xanh dương nhạt */
          color: #1D3557;
          padding: 12px 10px;
          text-align: left;
        }
        .pretty-table td {
          padding: 10px;
          background-color: #fefefe;
          border-bottom: 1px solid #eee;
        }
        .pretty-table tr:hover td {
          background-color: #f1f5f9;
        }
        .section-title {
          margin-top: 30px;
          color: #457B9D;
          font-size: 20px;
          border-left: 5px solid #DDF2F4;
          padding-left: 10px;
          margin-bottom: 10px;
        }
        .sub-title {
          font-size: 17px;
          margin-top: 20px;
          margin-bottom: 5px;
          color: #1D3557;
        }
      </style>
  
      <h3 class="section-title">💰 AWS Billing</h3>
      ${awsBilling.data?.length ? `
        <table class="pretty-table">
          <tr><th>Start</th><th>End</th><th>Amount (USD)</th><th>Estimated</th></tr>
          ${awsBilling.data.map(bill => `
            <tr>
              <td>${bill.TimePeriod.Start}</td>
              <td>${bill.TimePeriod.End}</td>
              <td>$${parseFloat(bill.Total.UnblendedCost.Amount).toFixed(4)}</td>
              <td>${bill.Estimated ? '✅' : '❌'}</td>
            </tr>
          `).join('')}
        </table>
      ` : 'No data available'}
  
      <h3 class="section-title">🪣 S3 Buckets</h3>
      ${s3Buckets.data?.length ? `
        <table class="pretty-table">
          <tr><th>Bucket Name</th><th>Creation Date</th></tr>
          ${s3Buckets.data.map(bucket => `
            <tr>
              <td>${bucket.bucket_name}</td>
              <td>${bucket.CreationDate}</td>
            </tr>
          `).join('')}
        </table>
      ` : 'No data available'}
  
      <h3 class="section-title">⚙️ GCP Services</h3>
      <div><strong>Project ID:</strong> ${gcpServices.data?.project_id || 'N/A'}</div>
  
      <div class="sub-title">🗄️ SQL Services</div>
      ${gcpServices.data?.sql_service?.length ? `
        <table class="pretty-table">
          <tr><th>Name</th><th>Create Time</th></tr>
          ${gcpServices.data.sql_service.map(s => `
            <tr>
              <td>${s.name}</td>
              <td>${s.createTime}</td>
            </tr>
          `).join('')}
        </table>
      ` : 'No SQL services'}
  
      <div class="sub-title">🖥️ Compute Instances</div>
      ${gcpServices.data?.compute_instance?.length ? `
        <table class="pretty-table">
          <tr><th>Name</th><th>Creation Time</th></tr>
          ${gcpServices.data.compute_instance.map(i => `
            <tr>
              <td>${i.name}</td>
              <td>${i.creationTimestamp}</td>
            </tr>
          `).join('')}
        </table>
      ` : 'No compute instances'}
  
      <div class="sub-title">🚀 Cloud Run</div>
      ${gcpServices.data?.cloud_run?.length ? `
        <table class="pretty-table">
          <tr><th>Name</th></tr>
          ${gcpServices.data.cloud_run.map(r => `
            <tr><td>${r.name}</td></tr>
          `).join('')}
        </table>
      ` : 'No Cloud Run services'}
  
      <h3 class="section-title">☁️ GCP Billing</h3>
      ${gcpBilling.data ? `
        <pre>${JSON.stringify(gcpBilling.data, null, 2)}</pre>
      ` : 'No data available'}
    `;
  }
  