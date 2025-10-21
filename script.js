/* -------------------------
  Logic: deterministic & personal
  - Tạo seed từ (name + dob + age)
  - PRNG mulberry32 (seeded)
  - Tính các chỉ số logic:
    * lifePath (số đường đời) từ DOB
    * zodiac (cung hoàng đạo)
    * nameScore (từ chữ)
    * ageGroup (trẻ/trung niên/già)
  - Kết quả = ghép các đoạn (title, summary, detail, advice) chọn bằng PRNG nhưng offset bởi các chỉ số logic
  - Tạo rất nhiều kết hợp => gần như không trùng lặp
------------------------- */

///// Utilities: hash + seeded RNG /////
function xfnv1a(str) {
  // fvn1a 32-bit hash
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function() {
    a |= 0;
    a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

///// Logic helpers /////
function sumDigits(n) {
  n = Math.abs(n);
  let s = 0;
  while (n > 0) { s += n % 10; n = Math.floor(n / 10); }
  return s;
}

function lifePathNumberFromDate(dateStr) {
  // dateStr: "YYYY-MM-DD"
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return 0;
  const total = parts[0] + parts[1] + parts[2];
  // reduce to 1-9 (traditional numerology)
  let x = total;
  while (x > 9) x = Math.floor(x / 10) + (x % 10);
  return x;
}

function zodiacFromDate(dateStr) {
  // return one of 12 signs
  const d = new Date(dateStr);
  const day = d.getUTCDate();
  const m = d.getUTCMonth() + 1; // 1-12
  const z = [
    {s:'Ma Kết', m:1, d:19},
    {s:'Bảo Bình', m:2, d:18},
    {s:'Song Ngư', m:3, d:20},
    {s:'Bạch Dương', m:4, d:20},
    {s:'Kim Ngưu', m:5, d:21},
    {s:'Song Tử', m:6, d:21},
    {s:'Cự Giải', m:7, d:22},
    {s:'Sư Tử', m:8, d:23},
    {s:'Xử Nữ', m:9, d:23},
    {s:'Thiên Bình', m:10, d:23},
    {s:'Bọ Cạp', m:11, d:22},
    {s:'Nhân Mã', m:12, d:21}
  ];
  for (let i = 0; i < z.length; i++) {
    if (m === z[i].m) {
      return (day <= z[i].d) ? (i===0?z[11].s:z[i-1].s) : z[i].s;
    }
  }
  return 'Unknown';
}

function nameScore(name) {
  // simple score: sum char codes mod 100
  let s = 0;
  for (let i=0;i<name.length;i++) s += name.charCodeAt(i);
  return s % 100;
}

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

///// Content pools (bigger arrays => more combinations) /////
// Each array length multiplies combinations. Sizes chosen to produce large combination counts.
const titles = [
  "Ngôi sao thầm thì", "Lời thì thầm từ Vũ trụ", "Dấu chỉ của Định mệnh",
  "Ánh trăng soi đường", "Bản đồ vận mệnh", "Dấu hiệu từ cõi sâu",
  "Tiếng vọng trong tâm hồn", "Chìa khóa định mệnh", "Khúc ca tương lai",
  "Bức thư từ vầng sao", "Nhịp điệu số phận"
];

const intros = [
  "Vũ trụ đã ghi nhận tần số của bạn.",
  "Ánh sao phản chiếu một nét riêng trong đời bạn.",
  "Từ tên và ngày sinh, một đường dẫn rõ dần thành hình.",
  "Những con số hé lộ một câu chuyện nhỏ.",
  "Dấu hiệu cho thấy năng lượng hiện nay đang dịch chuyển."
];

const summaries = [
  "Bạn đang ở ngã rẽ quan trọng: lựa chọn sẽ quyết định chu kỳ tiếp theo.",
  "Một chuỗi cơ hội nhỏ nhưng đúng lúc sẽ thay đổi cục diện.",
  "Năng lượng hiện tại khuyến khích bạn kiên nhẫn và chịu khó.",
  "Hãy mở lòng với những lời mời, nhưng chọn lọc kĩ càng.",
  "Linh cảm sẽ giúp bạn tránh sai lầm trong thời gian tới.",
  "Hành động nhỏ hôm nay sẽ cộng dồn thành thay đổi lớn sau này.",
  "Cân bằng giữa trực giác và lý trí là chìa khóa."
];

const details = [
  "Về mặt cảm xúc, bạn được khuyên nuôi dưỡng sự chân thành hơn.",
  "Công việc sẽ có chuyển biến nếu bạn chủ động mở rộng quan hệ.",
  "Tài chính đang ổn định nhưng chưa đủ cho kế hoạch lớn; tiết kiệm hợp lý.",
  "Gia đình là điểm tựa, sẽ có cơ hội hàn gắn mối quan hệ cũ.",
  "Sức khỏe tốt nếu bạn duy trì thói quen nghỉ ngơi hợp lý.",
  "Một người lạ hoặc đồng nghiệp có thể mang đến cơ hội.",
  "Thời gian thích hợp để học thêm kỹ năng nhỏ phục vụ tương lai."
];

const advices = [
  "Hãy lắng nghe trước khi nói — đó là vũ khí mạnh mẽ.",
  "Lập kế hoạch nhỏ, hành động đều mỗi ngày.",
  "Đừng đầu tư cảm xúc vào điều không chắc chắn.",
  "Tập thể dục tinh thần: thiền, viết nhật ký.",
  "Hãy mỉm cười với cơ hội dù nó chưa hoàn hảo.",
  "Ghi lại các giấc mơ, chúng có thể ẩn chứa gợi ý.",
  "Thành công bắt đầu từ việc hoàn thành việc nhỏ nhất."
];

const endings = [
  "Ngôi sao đang mỉm cười với bạn ✨",
  "Hãy giữ niềm tin, đổi thay đang tới 🌙",
  "Cẩn trọng nhưng đừng quá do dự 🔮",
  "Luôn nhớ: bạn không đi một mình 🌌",
  "Một chương mới đang mở ra cho bạn ⭐",
  "Giữ vững bản chất, rồi ánh sáng sẽ tới 💫"
];

const topicIntro = {
  tinhduyen: ["Trái tim bạn:", "Tình duyên hiển hiện như sau:"],
  hocvan: ["Con đường học vấn / sự nghiệp:", "Sự nghiệp và học tập nói rằng:"],
  tiente: ["Về tiền bạc & cơ hội:", "Dòng tiền hiện tại cho thấy:"],
  giadinh: ["Trong gia đình:", "Mối quan hệ gia đình nói rằng:"],
  suckhoe: ["Sức khỏe & năng lượng:", "Cơ thể và tinh thần hé lộ:"],
  vanmenh: ["Vận mệnh tổng quan:", "Bức tranh tổng thể là:"]
};

///// Main generation function /////
function generateProfile({name, dob, age, topic}) {
  const normalized = (name.trim().toLowerCase() + '|' + dob + '|' + age);
  const baseHash = xfnv1a(normalized);
  const rng = mulberry32(baseHash);

  // logic indices
  const life = lifePathNumberFromDate(dob);           // 1..9
  const zodiac = zodiacFromDate(dob);                 // string
  const nScore = nameScore(name);                     // 0..99
  const ageGroup = age < 25 ? 0 : (age < 45 ? 1 : (age < 65 ? 2 : 3));

  // create offsets from logic numbers to bias selection
  const offTitle = (life + (nScore % 7) + ageGroup) % titles.length;
  const offIntro = (nScore % intros.length);
  const offSummary = (life * 3 + (nScore % 5)) % summaries.length;
  const offDetail = (ageGroup * 2 + (nScore % 11)) % details.length;
  const offAdvice = (life + Math.floor(nScore/10)) % advices.length;
  const offEnd = (life + ageGroup + (nScore % 3)) % endings.length;

  // now mix with rng to diversify but deterministic because rng seeded
  function pick(pool, offset) {
    const rIndex = Math.floor(rng() * pool.length);
    // mix offset + rIndex to produce final index
    const idx = (rIndex + offset) % pool.length;
    return pool[idx];
  }

  // topic-specific fine-tuning (adds domain-specific adjective)
  const topicMap = {
    tinhduyen: ['mềm mỏng', 'nồng nhiệt', 'trầm lắng', 'lãng mạn', 'thẳng thắn'],
    hocvan: ['kiên trì', 'thực tế', 'sáng tạo', 'kỷ luật', 'tham vọng'],
    tiente: ['thận trọng', 'mạo hiểm', 'tích lũy', 'linh hoạt', 'dự phòng'],
    giadinh: ['bao dung', 'quan tâm', 'cân bằng', 'lắng nghe', 'đảm đang'],
    suckhoe: ['chăm sóc', 'dinh dưỡng', 'vận động', 'nghỉ ngơi', 'thư giãn'],
    vanmenh: ['kiên nhẫn', 'lộ trình', 'vượt khó', 'bền bỉ', 'mở lòng']
  };

  const topicAdject = (topicMap[topic] || ['tĩnh'])[(nScore + life) % 5];

  // score (0-100) influenced by life path, nameScore, rng
  const baseScore = clamp(Math.round((life * 8) + (nScore/1.5) + (ageGroup*5) + Math.floor(rng()*10)), 10, 95);

  // assemble result
  const title = pick(titles, offTitle);
  const intro = pick(intros, offIntro);
  const summary = pick(summaries, offSummary);
  const detail = pick(details, offDetail);
  const advice = pick(advices, offAdvice);
  const end = pick(endings, offEnd);

  // personalize detail and advice with topic & zodiac
  const topicHeader = (topicIntro[topic] || ['Phần', 'Chi tiết:'])[0];

  const result = {
    title,
    intro,
    summary,
    detail: `${detail} (Phù hợp với phong cách ${topicAdject} — cung ${zodiac}).`,
    advice,
    end,
    meta: {
      lifePath: life,
      zodiac,
      nameScore: nScore,
      ageGroup,
      baseHash,
      score: baseScore
    }
  };

  // final composed string for display (structured)
  const text = `
<div class="result-title">${title}</div>
<div class="result-meta">Người: <strong>${escapeHtml(name)}</strong> • Ngày sinh: <strong>${dob}</strong> • Tuổi: <strong>${age}</strong> • Cung: <strong>${zodiac}</strong> • Số đường đời: <strong>${life}</strong></div>

<div><strong>${topicHeader}</strong></div>
<div style="margin-top:8px"><em>${intro}</em></div>
<p style="margin-top:8px"><strong>Tóm tắt:</strong> ${summary}</p>
<p><strong>Chi tiết:</strong> ${result.detail}</p>
<p><strong>Lời khuyên:</strong> ${advice}</p>

<div style="margin-top:10px">
  <div><strong>Chỉ số may rủi:</strong> ${result.meta.score} / 100</div>
  <div class="score-bar" aria-hidden>
    <div class="score-fill" style="width:${result.meta.score}%"></div>
  </div>
</div>

<p style="margin-top:10px"><em>${end}</em></p>

<div style="margin-top:10px;color:rgba(255,255,255,0.65);font-size:13px">
  <div>Mã cá nhân: <code>${baseHash}</code> (kết quả này được sinh theo logic từ mã cá nhân, lặp lại nếu thông tin không đổi)</div>
</div>
`;

  return { html: text, meta: result.meta };
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

/* -------------------------
   UI interactions
------------------------- */

const formSection = document.getElementById('form-section');
const topicSection = document.getElementById('topic-section');
const resultSection = document.getElementById('result-section');
const startBtn = document.getElementById('startBtn');
const seedPreview = document.getElementById('seedPreview');
const againBtn = document.getElementById('againBtn');
const restartBtn = document.getElementById('restartBtn');
const resultArea = document.getElementById('result-area');
const modal = document.getElementById('modal');
const seedText = document.getElementById('seedText');
const closeModal = document.getElementById('closeModal');

let currentState = {}; // store name/dob/age and last seed/meta

startBtn.addEventListener('click', () => {
  const name = document.getElementById('name').value.trim();
  const age = parseInt(document.getElementById('age').value, 10);
  const dob = document.getElementById('dob').value;

  if (!name || !dob || !age || isNaN(age) || age <= 0) {
    alert('Vui lòng nhập đầy đủ: Họ tên, ngày sinh và tuổi (số hợp lệ).');
    return;
  }

  currentState = { name, dob, age };
  formSection.classList.remove('active');
  topicSection.classList.add('active');
});

seedPreview.addEventListener('click', () => {
  const name = document.getElementById('name').value.trim();
  const age = document.getElementById('age').value;
  const dob = document.getElementById('dob').value;
  if (!name || !dob || !age) { alert('Nhập đủ thông tin trước.'); return; }
  const baseHash = xfnv1a(name.toLowerCase() + '|' + dob + '|' + age);
  seedText.textContent = `seedHash: ${baseHash}\n(đây là mã cá nhân cho kết quả của bạn — dùng để tái tạo kết quả)`;
  modal.classList.add('show');
});

closeModal.addEventListener('click', ()=> modal.classList.remove('show'));

document.querySelectorAll('.topic').forEach(btn => {
  btn.addEventListener('click', () => {
    const t = btn.getAttribute('data-topic');
    const out = generateProfile({...currentState, topic: t});
    resultArea.innerHTML = out.html;
    topicSection.classList.remove('active');
    resultSection.classList.add('active');
  });
});

againBtn.addEventListener('click', ()=> {
  resultSection.classList.remove('active');
  topicSection.classList.add('active');
});

restartBtn.addEventListener('click', ()=> {
  resultSection.classList.remove('active');
  formSection.classList.add('active');
});

///// Galaxy background (canvas) /////
const canvas = document.getElementById('galaxy');
const ctx = canvas.getContext('2d');
function resizeCanvas(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

const stars = [];
for (let i=0;i<250;i++){
  stars.push({
    x: Math.random()*canvas.width,
    y: Math.random()*canvas.height,
    r: Math.random()*1.8+0.2,
    vx: (Math.random()-0.5)*0.02,
    vy: (Math.random()*0.6)+0.2,
    tw: Math.random()*Math.PI*2
  });
}
let t = 0;
function draw(){
  t += 0.004;
  // background gradient
  const g = ctx.createLinearGradient(0,0,canvas.width, canvas.height);
  g.addColorStop(0, '#030014');
  g.addColorStop(0.5, '#0b0033');
  g.addColorStop(1, '#02020a');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // occasional nebula blobs
  for (let i=0;i<6;i++){
    const cx = (i/6)*canvas.width + Math.sin(t + i)*80;
    const cy = canvas.height*0.25 + Math.cos(t*1.3 + i)*120;
    const rad = canvas.width*0.2;
    const ling = ctx.createRadialGradient(cx,cy,10,cx,cy,rad);
    ling.addColorStop(0, `rgba(120,60,255,${0.06 + Math.abs(Math.sin(t+i))*0.04})`);
    ling.addColorStop(1, 'rgba(10,0,30,0)');
    ctx.fillStyle = ling;
    ctx.beginPath();
    ctx.ellipse(cx,cy,rad,rad*0.6,0,0,Math.PI*2);
    ctx.fill();
  }

  // stars
  for (let s of stars){
    ctx.beginPath();
    const flick = 0.5 + 0.5*Math.sin(s.tw + t*5);
    ctx.fillStyle = `rgba(255,255,255,${0.5*flick})`;
    ctx.arc(s.x, s.y, s.r * (0.6+flick*0.8), 0, Math.PI*2);
    ctx.fill();
    s.y += s.vy;
    s.x += s.vx;
    s.tw += 0.01;
    if (s.y > canvas.height + 10){ s.y = -10; s.x = Math.random()*canvas.width; }
    if (s.x < -20) s.x = canvas.width+20;
    if (s.x > canvas.width+20) s.x = -20;
  }

  requestAnimationFrame(draw);
}
draw();

/* End of script */
