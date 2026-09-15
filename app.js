const VISTAS={
proveedores:{nombre:"Proveedores",archivo:"data/proveedores.json"},
trabajadores:{nombre:"Trabajadores",archivo:"data/trabajadores.json"},
cajas:{nombre:"Cajas",archivo:"data/cajas.json"},
pension:{nombre:"Pensión",archivo:"data/pension.json"},
claves:{nombre:"Claves",archivo:"data/claves.json"}
};
const CLAVE_ACCESO="111";
let vistaActual="proveedores";
let datos={proveedores:[],trabajadores:[],cajas:[],pension:[],claves:[]};
let datosBase={proveedores:[],trabajadores:[],cajas:[],pension:[],claves:[]};
let columnas={proveedores:[],trabajadores:[],cajas:[],pension:[],claves:[]};
let registrosLocales={proveedores:[],trabajadores:[],cajas:[],pension:[],claves:[]};
let ordenFilas={proveedores:[],trabajadores:[],cajas:[],pension:[],claves:[]};
let archivos={proveedores:null,trabajadores:null,cajas:null,pension:null,claves:null};
let filaArrastrada=null;
let columnaArrastrada=null;
const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const tabla=$("#tablaDatos");
const tablaHead=$("#tablaHead");
const tablaBody=$("#tablaBody");
const buscador=$("#buscador");
const inputExcel=$("#inputExcel");
async function iniciar(){
cargarLocalStorage();
configurarEventos();
cambiarVista("proveedores");
await cargarTodosLosJSON();
}
function configurarEventos(){
$$(".tab").forEach(tab=>tab.addEventListener("click",()=>cambiarVista(tab.dataset.vista)));
$$(".menu-item").forEach(item=>item.addEventListener("click",()=>cambiarPagina(item.dataset.page)));
$("#btnImportar").addEventListener("click",()=>inputExcel.click());
$("#btnImportarVacio").addEventListener("click",()=>inputExcel.click());
$("#btnNuevoRegistro").addEventListener("click",agregarRegistroManual);
$("#btnAgregarFilaFooter").addEventListener("click",agregarRegistroManual);
$("#btnAgregarColumna").addEventListener("click",abrirModalColumna);
$("#cancelarColumna").addEventListener("click",cerrarModalColumna);
$("#guardarColumna").addEventListener("click",guardarNuevaColumna);
inputExcel.addEventListener("change",procesarExcel);
buscador.addEventListener("input",()=>{buscador.parentElement.classList.toggle("has-text",!!buscador.value);renderTabla()});
$("#limpiarBusqueda").addEventListener("click",()=>{buscador.value="";buscador.parentElement.classList.remove("has-text");renderTabla()});
$("#cerrarExcelInfo").addEventListener("click",()=>$("#excelInfo").classList.add("hidden"));
$("#inputNuevaColumna").addEventListener("keydown",e=>{if(e.key==="Enter")guardarNuevaColumna();if(e.key==="Escape")cerrarModalColumna()});
$("#modalColumna").addEventListener("click",e=>{if(e.target.id==="modalColumna")cerrarModalColumna()});
$("#formAccesoClaves").addEventListener("submit",validarAccesoClaves);
$("#cancelarAccesoClaves").addEventListener("click",cerrarAccesoClaves);
$("#modalAccesoClaves").addEventListener("click",e=>{if(e.target.id==="modalAccesoClaves")cerrarAccesoClaves()});
$("#inputAccesoClaves").addEventListener("input",()=>$("#errorAccesoClaves").textContent="");
}
async function cargarTodosLosJSON(){
await Promise.all(Object.keys(VISTAS).map(cargarJSONVista));
renderTabla();
mostrarInfoArchivo();
actualizarResumen();
}
async function cargarJSONVista(vista){
try{
const r=await fetch(VISTAS[vista].archivo,{cache:"no-store"});
if(!r.ok)throw new Error(r.status);
const base=await r.json();
if(!Array.isArray(base))throw new Error("JSON inválido");
datosBase[vista]=base.filter(x=>x&&typeof x==="object"&&!Array.isArray(x)).map((x,i)=>({...x,__id:x.__id||`base_${vista}_${i}`}));
let colsBase=obtenerColumnas(datosBase[vista]);
if(!columnas[vista].length)columnas[vista]=colsBase;
else columnas[vista]=combinarColumnas(columnas[vista],colsBase);
reconstruirDatos(vista);
archivos[vista]={nombre:VISTAS[vista].archivo.split("/").pop(),registros:datosBase[vista].length,tipo:"json"};
}catch(e){
console.warn(VISTAS[vista].archivo,e);
reconstruirDatos(vista);
}
}
function reconstruirDatos(vista){
const combinados=[...datosBase[vista],...registrosLocales[vista]];
const mapa=new Map(combinados.map(r=>[r.__id,r]));
if(ordenFilas[vista].length){
const ordenados=[];
ordenFilas[vista].forEach(id=>{if(mapa.has(id)){ordenados.push(mapa.get(id));mapa.delete(id)}});
datos[vista]=[...ordenados,...mapa.values()];
}else datos[vista]=combinados;
ordenFilas[vista]=datos[vista].map(r=>r.__id);
}
function obtenerColumnas(registros){
const r=[];
registros.forEach(obj=>Object.keys(obj).forEach(k=>{if(k!=="__id"&&!r.includes(k))r.push(k)}));
return r;
}
function combinarColumnas(a,b){
const r=[...a];
b.forEach(x=>{if(!r.includes(x))r.push(x)});
return r;
}
function cambiarVista(vista){
if(vista==="claves"&&vistaActual!=="claves"){
abrirAccesoClaves();
return;
}
activarVista(vista);
}
function activarVista(vista){
vistaActual=vista;
buscador.value="";
buscador.parentElement.classList.remove("has-text");
$$(".tab").forEach(t=>t.classList.toggle("active",t.dataset.vista===vista));
$("#nombreVista").textContent=VISTAS[vista].nombre;
mostrarInfoArchivo();
renderTabla();
}
function abrirAccesoClaves(){
const modal=$("#modalAccesoClaves");
const input=$("#inputAccesoClaves");
input.value="";
$("#errorAccesoClaves").textContent="";
modal.classList.remove("hidden");
setTimeout(()=>input.focus(),0);
}
function cerrarAccesoClaves(){
$("#modalAccesoClaves").classList.add("hidden");
$("#inputAccesoClaves").value="";
$("#errorAccesoClaves").textContent="";
}
function validarAccesoClaves(e){
e.preventDefault();
if($("#inputAccesoClaves").value!==CLAVE_ACCESO){
$("#errorAccesoClaves").textContent="Contraseña incorrecta.";
$("#inputAccesoClaves").select();
return;
}
cerrarAccesoClaves();
activarVista("claves");
}
function cambiarPagina(pagina){
$$(".menu-item").forEach(x=>x.classList.toggle("active",x.dataset.page===pagina));
$$(".page").forEach(x=>x.classList.remove("active"));
if(pagina==="resumen"){$("#paginaResumen").classList.add("active");$("#breadcrumbActual").textContent="Resumen";actualizarResumen()}
else{$("#paginaDirectorio").classList.add("active");$("#breadcrumbActual").textContent="Directorio"}
}
function renderTabla(){
const cols=columnas[vistaActual];
const todos=datos[vistaActual];
const term=normalizar(buscador.value);
const registros=term?todos.filter(r=>cols.some(c=>normalizar(r[c]).includes(term))):todos;
tablaHead.innerHTML="";
tablaBody.innerHTML="";
if(!cols.length){
tabla.classList.remove("visible");
$("#emptyState").classList.remove("hidden");
$("#noResults").classList.add("hidden");
actualizarContadores(0);
ajustarAltoTabla(0);
return;
}
$("#emptyState").classList.add("hidden");
if(!registros.length&&term){
tabla.classList.remove("visible");
$("#noResults").classList.remove("hidden");
actualizarContadores(0,todos.length);
return;
}
$("#noResults").classList.add("hidden");
tabla.classList.add("visible");
const num=document.createElement("th");
num.className="row-number";
num.textContent="N°";
tablaHead.appendChild(num);
cols.forEach((col,i)=>{
const th=document.createElement("th");
th.className="draggable-header";
th.draggable=true;
th.dataset.index=i;
th.addEventListener("dragstart",e=>iniciarArrastreColumna(e,i));
th.addEventListener("dragover",e=>e.preventDefault());
th.addEventListener("drop",e=>soltarColumna(e,i));
const wrap=document.createElement("div");
wrap.className="column-header";
const label=document.createElement("span");
label.className="column-header-label";
label.textContent=col;
const btn=document.createElement("button");
btn.type="button";
btn.className="column-remove-btn";
btn.title=`Eliminar columna ${col}`;
btn.textContent="×";
btn.addEventListener("click",e=>{e.stopPropagation();eliminarColumna(col);});
wrap.appendChild(label);
wrap.appendChild(btn);
th.appendChild(wrap);
tablaHead.appendChild(th);
});
const ac=document.createElement("th");
ac.className="action-column";
tablaHead.appendChild(ac);
registros.forEach((r,i)=>tablaBody.appendChild(crearFila(r,i)));
actualizarContadores(registros.length,todos.length);
requestAnimationFrame(()=>ajustarAltoTabla(registros.length));
}
function crearFila(registro,index){
const tr=document.createElement("tr");
tr.dataset.id=registro.__id;
tr.draggable=!buscador.value;
const n=document.createElement("td");
n.className="row-number";
n.innerHTML=`<span class="drag-row-icon">⠿</span>${index+1}`;
tr.appendChild(n);
columnas[vistaActual].forEach(c=>{
const td=document.createElement("td");
const valor=document.createElement("span");
valor.textContent=registro[c]??"";
if(vistaActual==="claves"&&normalizar(c)==="clave")valor.className="valor-clave";
td.appendChild(valor);
tr.appendChild(td);
});
const acciones=document.createElement("td");
acciones.className="action-column";
acciones.innerHTML=`<div class="row-actions"><button class="row-action edit" title="Editar">✎</button><button class="row-action delete" title="Eliminar">×</button></div>`;
acciones.querySelector(".edit").onclick=e=>{e.stopPropagation();editarFila(tr,registro)};
acciones.querySelector(".delete").onclick=e=>{e.stopPropagation();eliminarFila(registro)};
tr.appendChild(acciones);
if(!buscador.value){
tr.addEventListener("dragstart",e=>{filaArrastrada=registro.__id;tr.classList.add("dragging");e.dataTransfer.effectAllowed="move"});
tr.addEventListener("dragend",()=>tr.classList.remove("dragging"));
tr.addEventListener("dragover",e=>{e.preventDefault();tr.classList.add("drag-over")});
tr.addEventListener("dragleave",()=>tr.classList.remove("drag-over"));
tr.addEventListener("drop",e=>{e.preventDefault();tr.classList.remove("drag-over");soltarFila(registro.__id)});
}
return tr;
}
function iniciarArrastreColumna(e,index){
columnaArrastrada=index;
e.currentTarget.classList.add("dragging");
e.dataTransfer.effectAllowed="move";
setTimeout(()=>e.currentTarget.classList.remove("dragging"),0);
}
function soltarColumna(e,destino){
e.preventDefault();
if(columnaArrastrada===null||columnaArrastrada===destino)return;
const cols=columnas[vistaActual];
const [movida]=cols.splice(columnaArrastrada,1);
cols.splice(destino,0,movida);
columnaArrastrada=null;
guardarLocalStorage();
renderTabla();
}
function soltarFila(idDestino){
if(!filaArrastrada||filaArrastrada===idDestino)return;
const orden=ordenFilas[vistaActual];
const origen=orden.indexOf(filaArrastrada);
const destino=orden.indexOf(idDestino);
if(origen<0||destino<0)return;
const [id]=orden.splice(origen,1);
orden.splice(destino,0,id);
filaArrastrada=null;
reconstruirDatos(vistaActual);
guardarLocalStorage();
renderTabla();
}
function editarFila(tr,registro){
tr.draggable=false;
const celdas=[...tr.children];
columnas[vistaActual].forEach((col,i)=>{
const td=celdas[i+1];
const input=document.createElement("input");
input.className="edit-input";
input.value=registro[col]??"";
input.dataset.col=col;
td.innerHTML="";
td.appendChild(input);
});
const action=celdas[celdas.length-1];
action.innerHTML=`<div class="edit-actions"><button class="edit-save">✓</button><button class="edit-cancel">×</button></div>`;
action.querySelector(".edit-save").onclick=()=>guardarEdicionFila(tr,registro);
action.querySelector(".edit-cancel").onclick=()=>renderTabla();
const primero=tr.querySelector(".edit-input");
if(primero)primero.focus();
}
function guardarEdicionFila(tr,registro){
tr.querySelectorAll(".edit-input").forEach(input=>registro[input.dataset.col]=input.value.trim());
convertirBaseALocal(registro);
guardarLocalStorage();
renderTabla();
mostrarToast("Cambios guardados","El registro fue actualizado.",true);
}
function convertirBaseALocal(registro){
if(!registro.__id.startsWith("base_"))return;
const indice=datosBase[vistaActual].findIndex(x=>x.__id===registro.__id);
if(indice>=0)datosBase[vistaActual].splice(indice,1);
registro.__id=`local_${Date.now()}_${Math.random().toString(36).slice(2)}`;
registrosLocales[vistaActual].push(registro);
const pos=ordenFilas[vistaActual].findIndex(id=>id.startsWith("base_")&&datos[vistaActual].find(x=>x.__id===registro.__id));
if(pos>=0)ordenFilas[vistaActual][pos]=registro.__id;
reconstruirDatos(vistaActual);
}
function eliminarFila(registro){
if(!confirm("¿Eliminar este registro?"))return;
datosBase[vistaActual]=datosBase[vistaActual].filter(x=>x.__id!==registro.__id);
registrosLocales[vistaActual]=registrosLocales[vistaActual].filter(x=>x.__id!==registro.__id);
ordenFilas[vistaActual]=ordenFilas[vistaActual].filter(id=>id!==registro.__id);
datos[vistaActual]=datos[vistaActual].filter(x=>x.__id!==registro.__id);
guardarLocalStorage();
renderTabla();
actualizarResumen();
mostrarToast("Registro eliminado","El registro fue eliminado de la vista.",true);
}
function agregarRegistroManual(){
if(!columnas[vistaActual].length){
mostrarToast("Sin columnas","Agrega primero una columna.",false);
return;
}
const registro={__id:`local_${Date.now()}_${Math.random().toString(36).slice(2)}`};
columnas[vistaActual].forEach(c=>registro[c]="");
registrosLocales[vistaActual].push(registro);
ordenFilas[vistaActual].push(registro.__id);
reconstruirDatos(vistaActual);
guardarLocalStorage();
renderTabla();
const tr=tablaBody.querySelector(`tr[data-id="${registro.__id}"]`);
if(tr)editarFila(tr,registro);
actualizarResumen();
}
function abrirModalColumna(){
$("#inputNuevaColumna").value="";
$("#modalColumna").classList.remove("hidden");
setTimeout(()=>$("#inputNuevaColumna").focus(),30);
}
function cerrarModalColumna(){
$("#modalColumna").classList.add("hidden");
}
function guardarNuevaColumna(){
const nombre=$("#inputNuevaColumna").value.trim();
if(!nombre)return;
if(columnas[vistaActual].some(c=>normalizar(c)===normalizar(nombre))){
mostrarToast("Columna existente","Ya existe una columna con ese nombre.",false);
return;
}
columnas[vistaActual].push(nombre);
datosBase[vistaActual].forEach(r=>r[nombre]="");
registrosLocales[vistaActual].forEach(r=>r[nombre]="");
cerrarModalColumna();
guardarLocalStorage();
renderTabla();
mostrarToast("Columna agregada",`${nombre} fue agregada a la tabla.`,true);
}
function eliminarColumna(nombreColumna){
if(!nombreColumna)return;
if(!confirm(`¿Eliminar la columna "${nombreColumna}"?\nSe quitará de todos los registros.`))return;
const indice=columnas[vistaActual].indexOf(nombreColumna);
if(indice===-1)return;
columnas[vistaActual].splice(indice,1);
[...datosBase[vistaActual],...registrosLocales[vistaActual]].forEach(r=>{if(r&&typeof r==="object")delete r[nombreColumna];});
datos[vistaActual]=datos[vistaActual].map(r=>{
const copia={...r};
delete copia[nombreColumna];
return copia;
});
guardarLocalStorage();
renderTabla();
actualizarResumen();
mostrarToast("Columna eliminada",`${nombreColumna} fue eliminada de la vista.`,true);
}
function ajustarAltoTabla(cantidad){
const c=$("#tableScroll");
if(!c)return;
if(cantidad<=10){c.classList.remove("scroll-vertical-activo");c.style.maxHeight="none";c.style.overflowY="hidden";return}
const head=tabla.querySelector("thead");
const filas=[...tablaBody.querySelectorAll("tr")].slice(0,10);
let alto=head?head.getBoundingClientRect().height:34;
filas.forEach(f=>alto+=f.getBoundingClientRect().height);
c.classList.add("scroll-vertical-activo");
c.style.maxHeight=`${Math.ceil(alto)}px`;
c.style.overflowY="auto";
}
function procesarExcel(e){
const archivo=e.target.files[0];
if(!archivo)return;
const lector=new FileReader();
lector.onload=ev=>{
try{
const wb=XLSX.read(new Uint8Array(ev.target.result),{type:"array",cellDates:true});
const ws=wb.Sheets[wb.SheetNames[0]];
if(!ws["A1"])throw new Error("A1 vacío");
const matriz=XLSX.utils.sheet_to_json(ws,{header:1,defval:"",raw:false});
const headers=matriz[0].map(x=>String(x).trim()).filter(Boolean);
const nuevos=[];
matriz.slice(1).forEach(fila=>{
if(!fila.some(v=>String(v).trim()))return;
const r={__id:`local_${Date.now()}_${Math.random().toString(36).slice(2)}`};
headers.forEach((h,i)=>r[h]=String(fila[i]??""));
nuevos.push(r);
});
columnas[vistaActual]=combinarColumnas(columnas[vistaActual],headers);
registrosLocales[vistaActual].push(...nuevos);
ordenFilas[vistaActual].push(...nuevos.map(r=>r.__id));
reconstruirDatos(vistaActual);
guardarLocalStorage();
renderTabla();
actualizarResumen();
mostrarToast("Excel importado",`${nuevos.length} registros agregados.`,true);
}catch(err){mostrarToast("Error","Verifica que los encabezados comiencen en A1.",false)}
};
lector.readAsArrayBuffer(archivo);
inputExcel.value="";
}
function actualizarContadores(mostrados,total=null){
const t=total===null?mostrados:total;
const texto=total!==null&&mostrados!==total?`${mostrados} de ${total} registros`:`${t} ${t===1?"registro":"registros"}`;
$("#contadorRegistros").textContent=texto;
$("#footerRegistros").textContent=texto;
}
function mostrarInfoArchivo(){
const info=archivos[vistaActual];
if(!info){$("#excelInfo").classList.add("hidden");return}
$("#excelNombre").textContent=info.nombre;
$("#excelDetalle").textContent=`Archivo de datos · ${info.registros} registros base`;
$("#excelInfo").classList.remove("hidden");
}
function actualizarResumen(){
$("#totalProveedores").textContent=datos.proveedores.length;
$("#totalTrabajadores").textContent=datos.trabajadores.length;
$("#totalCajas").textContent=datos.cajas.length;
$("#totalPension").textContent=datos.pension.length;
$("#totalClaves").textContent=datos.claves.length;
}
function normalizar(v){
return String(v??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim();
}
function guardarLocalStorage(){
localStorage.setItem("directorio_registros",JSON.stringify(registrosLocales));
localStorage.setItem("directorio_columnas",JSON.stringify(columnas));
localStorage.setItem("directorio_orden",JSON.stringify(ordenFilas));
}
function cargarLocalStorage(){
try{
const r=JSON.parse(localStorage.getItem("directorio_registros")||"null");
const c=JSON.parse(localStorage.getItem("directorio_columnas")||"null");
const o=JSON.parse(localStorage.getItem("directorio_orden")||"null");
if(r)registrosLocales={...registrosLocales,...r};
if(c)columnas={...columnas,...c};
if(o)ordenFilas={...ordenFilas,...o};
}catch(e){}
}
let toastTimer;
function mostrarToast(titulo,mensaje,ok=true){
clearTimeout(toastTimer);
$("#toastTitulo").textContent=titulo;
$("#toastMensaje").textContent=mensaje;
$("#toastIcon").textContent=ok?"✓":"!";
$("#toastIcon").style.background=ok?"#e6f4ea":"#fdeaea";
$("#toastIcon").style.color=ok?"#238636":"#d93025";
$("#toast").classList.add("show");
toastTimer=setTimeout(()=>$("#toast").classList.remove("show"),3000);
}
if(typeof document!=="undefined")iniciar();
if(typeof module!=="undefined"){
module.exports={
  eliminarColumna,
  normalizar,
  combinarColumnas,
  obtenerColumnas,
};
}
