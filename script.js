const USER_NAME = "Lúcia"; // Altere o nome diretamente aqui no código.
const USER_AGE = 41; // Altere a idade diretamente aqui no código.
const INITIAL_BALANCE = 0;
const STORAGE_KEY = "meuDinheiroProjetoV2";
const DEFAULT_DATA = {
  goal: 1000,
  transactions: [
    { id: "demo-1", description: "Mesada", amount: 300, type: "income", date: "2026-10-20" },
    { id: "demo-2", description: "Lanche", amount: 25, type: "expense", date: "2026-10-21" },
    { id: "demo-3", description: "Transporte", amount: 15, type: "expense", date: "2026-10-22" },
    { id: "demo-4", description: "Material escolar", amount: 48.5, type: "expense", date: "2026-10-23" },
    { id: "demo-5", description: "Trabalho extra", amount: 120, type: "income", date: "2026-10-25" },
    { id: "demo-6", description: "Cinema", amount: 36, type: "expense", date: "2026-10-26" },
    { id: "demo-7", description: "Presente", amount: 80, type: "income", date: "2026-10-27" }
  ]
};
let data = loadData();
let toastTimeout;
const $ = (id) => document.getElementById(id);
const balanceValue = $("balanceValue"), incomeValue = $("incomeValue"), expenseValue = $("expenseValue");
const savingsRate = $("savingsRate"), transactionForm = $("transactionForm");
const descriptionInput = $("transactionDescription"), amountInput = $("transactionAmount");
const typeInput = $("transactionType"), dateInput = $("transactionDate");
const tableBody = $("transactionTableBody"), filterInput = $("transactionFilter");
const searchInput = $("searchTransactions"), transactionCount = $("transactionCount");
const flowCanvas = $("flowChart"), categoryCanvas = $("categoryChart");

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && Array.isArray(saved.transactions) && saved.transactions.every(isValidTransaction)) {
      return { goal: Number.isFinite(saved.goal) && saved.goal > 0 ? saved.goal : 1000, transactions: saved.transactions };
    }
  } catch (error) { console.warn("Não foi possível carregar os dados salvos.", error); }
  return structuredClone(DEFAULT_DATA);
}
function isValidTransaction(t) {
  return t && typeof t.id === "string" && typeof t.description === "string" &&
    Number.isFinite(t.amount) && t.amount > 0 && ["income", "expense"].includes(t.type) &&
    typeof t.date === "string";
}
function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; }
  catch (error) { showToast("Não foi possível salvar os dados neste navegador."); return false; }
}
function money(value) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function compactMoney(value) {
  if (Math.abs(value) >= 1000) return "R$ " + (value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + " mil";
  return money(value);
}
function dateLabel(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value || "—";
  const [y, m, d] = value.split("-");
  return `${d}/${m}/${y}`;
}
function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
}
function monthKey(date) { return date.slice(0, 7); }
function getTotals(items = data.transactions) {
  const income = items.filter(t => t.type === "income").reduce((sum,t)=>sum+t.amount,0);
  const expense = items.filter(t => t.type === "expense").reduce((sum,t)=>sum+t.amount,0);
  return { income, expense, balance: INITIAL_BALANCE + income - expense };
}
function categoryOf(description) {
  const d = description.toLocaleLowerCase("pt-BR");
  const groups = [
    ["Alimentação", ["lanche","mercado","supermercado","restaurante","comida","pizza","almoço","jantar","café"]],
    ["Transporte", ["transporte","ônibus","onibus","uber","combustível","combustivel","gasolina","passagem"]],
    ["Estudos", ["escola","material","livro","curso","caderno","caneta","estudo"]],
    ["Lazer", ["cinema","jogo","game","passeio","show","streaming","festa"]],
    ["Casa", ["água","agua","luz","internet","aluguel","casa"]],
    ["Saúde", ["farmácia","farmacia","médico","medico","remédio","remedio"]],
    ["Renda", ["mesada","salário","salario","trabalho","freelance","venda","extra"]]
  ];
  for (const [category, words] of groups) if (words.some(word => d.includes(word))) return category;
  return "Outros";
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
function csvSafe(value) {
  const text = String(value);
  return /^[=+\-@\t\r]/.test(text) ? "'" + text : text;
}
function render() {
  const totals = getTotals();
  balanceValue.textContent = money(totals.balance);
  incomeValue.textContent = money(totals.income);
  expenseValue.textContent = money(totals.expense);
  const rate = totals.income ? Math.round(((totals.income - totals.expense) / totals.income) * 100) : 0;
  savingsRate.textContent = `${Math.max(-1000, Math.min(100, rate))}%`;
  renderGoal(totals);
  renderTable();
  renderInsights(totals);
  drawFlowChart();
  drawCategoryChart();
  $("userNameDisplay").textContent = USER_NAME;
  $("userAgeDisplay").textContent = `${USER_AGE} anos`;
  $("userAvatar").textContent = USER_NAME.trim().charAt(0).toLocaleUpperCase("pt-BR") || "M";
  $("todayLabel").textContent = new Intl.DateTimeFormat("pt-BR", { day:"2-digit", month:"short", year:"numeric" }).format(new Date());
  $("transactionDate").value ||= todayISO();
}
function renderGoal(totals) {
  const saved = Math.max(0, totals.balance - INITIAL_BALANCE);
  const percent = Math.min(100, Math.round(saved / data.goal * 100));
  $("savedAmount").textContent = money(saved);
  $("goalTargetLabel").textContent = money(data.goal);
  $("goalTarget").value = data.goal;
  $("goalProgress").style.width = `${percent}%`;
  $("goalPercent").textContent = `${percent}% concluído`;
  $("goalRemaining").textContent = saved >= data.goal ? "Meta alcançada! 🎉" : `Faltam ${money(data.goal - saved)}`;
}
function renderTable() {
  const type = filterInput.value;
  const search = searchInput.value.trim().toLocaleLowerCase("pt-BR");
  const items = [...data.transactions].sort((a,b)=>b.date.localeCompare(a.date));
  const filtered = items.filter(t => (type === "all" || t.type === type) &&
    `${t.description} ${categoryOf(t.description)} ${dateLabel(t.date)}`.toLocaleLowerCase("pt-BR").includes(search));
  tableBody.innerHTML = filtered.length ? filtered.map(t => {
    const income = t.type === "income";
    const cat = categoryOf(t.description);
    return `<tr>
      <td><div class="transaction-title"><span class="transaction-symbol ${income?"symbol-income":"symbol-expense"}">${income?"↗":"↘"}</span><span>${escapeHTML(t.description)}</span></div></td>
      <td><span class="category-tag">${escapeHTML(cat)}</span></td>
      <td>${dateLabel(t.date)}</td>
      <td><span class="type-tag ${income?"type-income":"type-expense"}">${income?"Receita":"Despesa"}</span></td>
      <td class="align-right ${income?"amount-income":"amount-expense"}">${income?"+":"−"} ${money(t.amount)}</td>
      <td><button class="delete-btn" type="button" data-delete="${escapeHTML(t.id)}" aria-label="Excluir ${escapeHTML(t.description)}" title="Excluir">✕</button></td>
    </tr>`;
  }).join("") : `<tr><td colspan="6" class="empty-row">Nenhuma movimentação encontrada. Adicione um registro acima.</td></tr>`;
  transactionCount.textContent = `${filtered.length} ${filtered.length === 1 ? "movimentação" : "movimentações"}`;
}
function renderInsights(totals) {
  const expenses = data.transactions.filter(t=>t.type==="expense");
  const income = data.transactions.filter(t=>t.type==="income");
  const biggest = [...expenses].sort((a,b)=>b.amount-a.amount)[0];
  const mostFrequent = Object.entries(expenses.reduce((acc,t)=>{const c=categoryOf(t.description);acc[c]=(acc[c]||0)+t.amount;return acc;},{})).sort((a,b)=>b[1]-a[1])[0];
  const balanceText = totals.balance >= INITIAL_BALANCE ? `Seu saldo está ${money(totals.balance - INITIAL_BALANCE)} acima do saldo inicial.` : `Suas despesas já superaram as entradas em relação ao saldo inicial.`;
  const items = [
    ["✦", `<strong>${balanceText}</strong>`],
    biggest ? ["↘", `Sua maior despesa registrada foi <strong>${escapeHTML(biggest.description)}</strong>, no valor de <strong>${money(biggest.amount)}</strong>.`] : ["↘", "Registre uma despesa para descobrir qual foi a maior."],
    mostFrequent ? ["◎", `A categoria com mais gastos é <strong>${escapeHTML(mostFrequent[0])}</strong>, somando <strong>${money(mostFrequent[1])}</strong>.`] : ["◎", "Adicione despesas para visualizar as categorias que mais pesam no orçamento."],
    income.length ? ["↗", `Você registrou <strong>${income.length}</strong> ${income.length===1?"receita":"receitas"} até agora.`] : ["↗", "Adicione suas receitas para acompanhar quanto dinheiro entrou."]
  ];
  $("insightsList").innerHTML = items.map(([symbol,content])=>`<div class="insight-item"><span class="insight-symbol">${symbol}</span><p>${content}</p></div>`).join("");
}
function getLastSixMonths() {
  const now = new Date();
  const months = [];
  for(let i=5;i>=0;i--) {
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    months.push({ key:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`, label:d.toLocaleDateString("pt-BR",{month:"short"}).replace(".","") });
  }
  return months;
}
function setupCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const width = Math.max(240, rect.width || 400), height = Math.max(160, rect.height || 220);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(width*dpr); canvas.height = Math.round(height*dpr);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr,0,0,dpr,0,0);
  return {ctx,width,height};
}
function drawFlowChart() {
  if (!flowCanvas) return;
  const {ctx,width,height}=setupCanvas(flowCanvas);
  ctx.clearRect(0,0,width,height);
  const months=getLastSixMonths();
  const values=months.map(m=>({
    ...m,
    income:data.transactions.filter(t=>t.type==="income"&&monthKey(t.date)===m.key).reduce((s,t)=>s+t.amount,0),
    expense:data.transactions.filter(t=>t.type==="expense"&&monthKey(t.date)===m.key).reduce((s,t)=>s+t.amount,0)
  }));
  const max=Math.max(100,...values.flatMap(m=>[m.income,m.expense]))*1.15;
  const left=38,right=10,top=12,bottom=30,chartH=height-top-bottom,chartW=width-left-right;
  ctx.font="10px DM Sans, sans-serif";ctx.textBaseline="middle";
  for(let i=0;i<4;i++){
    const y=top+chartH*i/3;
    ctx.strokeStyle="rgba(0,229,255,.12)";ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(width-right,y);ctx.stroke();
    ctx.fillStyle="#6f86a8";ctx.textAlign="right";ctx.fillText(i===3?"0":compactAxis(max*(1-i/3)),left-7,y);
  }
  const group=chartW/values.length,barW=Math.min(18,group*.25);
  values.forEach((m,i)=>{
    const center=left+group*(i+.5);
    [[m.income,"#39ff88",-barW*.65], [m.expense,"#ff2bd6",barW*.65]].forEach(([val,color,offset])=>{
      const h=Math.max(val>0?2:0,(val/max)*chartH);
      ctx.fillStyle=color;roundRect(ctx,center+offset-barW/2,top+chartH-h,barW,h,5);ctx.fill();
    });
    ctx.fillStyle="#6f86a8";ctx.textAlign="center";ctx.fillText(m.label,center,height-12);
  });
  const current=values[values.length-1];
  $("flowNote").textContent=`Neste mês: ${money(current.income)} em receitas e ${money(current.expense)} em despesas.`;
}
function compactAxis(n){return n>=1000?(n/1000).toLocaleString("pt-BR",{maximumFractionDigits:1})+"k":Math.round(n).toString();}
function roundRect(ctx,x,y,w,h,r){const radius=Math.min(r,w/2,h/2);ctx.beginPath();ctx.moveTo(x+radius,y);ctx.arcTo(x+w,y,x+w,y+h,radius);ctx.arcTo(x+w,y+h,x,y+h,radius);ctx.arcTo(x,y+h,x,y,radius);ctx.arcTo(x,y,x+w,y,radius);ctx.closePath();}
const categoryColors=["#00e5ff","#39ff88","#ff2bd6","#ffb800","#9d7bff","#ff6b35","#4d8dff"];
function drawCategoryChart() {
  const {ctx,width,height}=setupCanvas(categoryCanvas);
  ctx.clearRect(0,0,width,height);
  const totals={};
  data.transactions.filter(t=>t.type==="expense").forEach(t=>{const c=categoryOf(t.description);totals[c]=(totals[c]||0)+t.amount;});
  const entries=Object.entries(totals).sort((a,b)=>b[1]-a[1]);
  const total=entries.reduce((s,e)=>s+e[1],0);
  $("donutTotal").textContent=compactMoney(total);
  const cx=width/2,cy=height/2,r=Math.min(width,height)*.39,inner=r*.68;
  if(!total){
    ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle="rgba(0,229,255,.12)";ctx.lineWidth=r-inner;ctx.stroke();
    $("categoryLegend").innerHTML=`<p class="chart-note">Adicione despesas para preencher o gráfico.</p>`;return;
  }
  let angle=-Math.PI/2;
  entries.forEach(([name,value],i)=>{
    const next=angle+value/total*Math.PI*2;
    ctx.beginPath();ctx.arc(cx,cy,r,angle,next);ctx.strokeStyle=categoryColors[i%categoryColors.length];ctx.lineWidth=r-inner;ctx.lineCap="butt";ctx.stroke();angle=next;
  });
  $("categoryLegend").innerHTML=entries.slice(0,5).map(([name,value],i)=>`<div class="category-row"><span class="category-swatch" style="background:${categoryColors[i%categoryColors.length]}"></span><span class="category-name">${escapeHTML(name)}</span><strong class="category-amount">${money(value)}</strong></div>`).join("");
}
function showToast(message) {
  const toast=$("toast");toast.textContent=message;toast.classList.add("show");
  clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>toast.classList.remove("show"),2800);
}
transactionForm.addEventListener("submit",event=>{
  event.preventDefault();
  const description=descriptionInput.value.trim(),amount=Number(amountInput.value),type=typeInput.value,date=dateInput.value||todayISO();
  if(!description||!Number.isFinite(amount)||amount<=0){showToast("Confira a descrição e o valor informado.");return;}
  data.transactions.push({id:`tx-${Date.now()}-${Math.random().toString(16).slice(2,7)}`,description,amount:Math.round(amount*100)/100,type,date});
  saveData();render();transactionForm.reset();dateInput.value=todayISO();typeInput.value="income";descriptionInput.focus();showToast("Movimentação adicionada com sucesso!");
});
$("goalForm").addEventListener("submit",event=>{
  event.preventDefault();const goal=Number($("goalTarget").value);
  if(!Number.isFinite(goal)||goal<=0){showToast("Informe uma meta maior que zero.");return;}
  data.goal=Math.round(goal*100)/100;saveData();renderGoal(getTotals());showToast("Meta de economia atualizada!");
});
filterInput.addEventListener("change",renderTable);
searchInput.addEventListener("input",renderTable);
tableBody.addEventListener("click",event=>{
  const button=event.target.closest("[data-delete]");if(!button)return;
  const item=data.transactions.find(t=>t.id===button.dataset.delete);if(!item)return;
  if(!confirm(`Excluir a movimentação "${item.description}"?`))return;
  data.transactions=data.transactions.filter(t=>t.id!==item.id);saveData();render();showToast("Movimentação excluída.");
});
$("resetDemo").addEventListener("click",()=>{
  if(!confirm("Restaurar os dados de demonstração? Suas movimentações atuais serão substituídas."))return;
  data=structuredClone(DEFAULT_DATA);saveData();filterInput.value="all";searchInput.value="";render();showToast("Demonstração restaurada.");
});
$("exportCsv").addEventListener("click",()=>{
  const rows=[["Descrição","Categoria","Data","Tipo","Valor"],...data.transactions.map(t=>[csvSafe(t.description),categoryOf(t.description),dateLabel(t.date),t.type==="income"?"Receita":"Despesa",t.amount.toFixed(2).replace(".",",")])];
  const csv="\uFEFF"+rows.map(row=>row.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(";")).join("\r\n");
  const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="relatorio-financeiro.csv";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);showToast("Relatório CSV exportado!");
});
let resizeTimer;
window.addEventListener("resize",()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{drawFlowChart();drawCategoryChart();},100);});
render();
document.fonts?.ready.then(()=>{drawFlowChart();drawCategoryChart();});
const navLinks=[...document.querySelectorAll(".nav-link")];
const navSections=navLinks.map(a=>document.querySelector(a.getAttribute("href"))).filter(Boolean);
function updateActiveNav(){
  const y=window.scrollY+window.innerHeight*.35;
  const tops=navSections.map(section=>({section,top:section.getBoundingClientRect().top+window.scrollY}));
  const atBottom=window.innerHeight+window.scrollY>=document.documentElement.scrollHeight-4;
  const passed=tops.filter(item=>item.top<=y);
  const pool=atBottom||!passed.length?tops:passed;
  const current=pool.reduce((a,b)=>(atBottom||passed.length?b.top>a.top:b.top<a.top)?b:a).section;
  navLinks.forEach(a=>a.classList.toggle("active",a.getAttribute("href")==="#"+current.id));
}
window.addEventListener("scroll",updateActiveNav,{passive:true});
updateActiveNav();
