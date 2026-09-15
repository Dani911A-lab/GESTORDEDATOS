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
let archivosCarga=[];
let vistaArchivoActual=null;
let archivoResumenActual=null;
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
const botonOpciones=$("#btnOpcionesContenido");
const menuOpciones=$("#menuOpcionesContenido");
botonOpciones.addEventListener("click",e=>{e.stopPropagation();const abierto=menuOpciones.classList.toggle("hidden");botonOpciones.setAttribute("aria-expanded",String(!abierto))});
document.addEventListener("click",e=>{if(!e.target.closest(".opciones-contenido")){menuOpciones.classList.add("hidden");botonOpciones.setAttribute("aria-expanded","false")}});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){menuOpciones.classList.add("hidden");botonOpciones.setAttribute("aria-expanded","false")}});
$("#btnExportarContenido").addEventListener("click",exportarContenido);
$("#btnImportarContenido").addEventListener("click",()=>$("#archivoImportarContenido").click());
$("#archivoImportarContenido").addEventListener("change",importarContenido);
$$('.vista-resumen').forEach(b=>b.addEventListener('click',()=>cambiarVistaResumen(b.dataset.resumen)));
$("#selectorArchivoResumen").addEventListener("change",e=>{archivoResumenActual=e.target.value;actualizarResumen()});
$$(".tab").forEach(tab=>tab.addEventListener("click",()=>cambiarVista(tab.dataset.vista)));
$$(".menu-item").forEach(item=>item.addEventListener("click",()=>cambiarPagina(item.dataset.page)));
$("#btnImportar").addEventListener("click",()=>inputExcel.click());
$("#btnImportarVacio").addEventListener("click",()=>inputExcel.click());
$("#btnPegarExcel").addEventListener("click",abrirPegarExcel);
$("#btnPegarExcelVacio").addEventListener("click",abrirPegarExcel);
$("#cancelarPegarExcel").addEventListener("click",cerrarPegarExcel);
$("#confirmarPegarExcel").addEventListener("click",agregarDatosPegados);
$("#modalPegarExcel").addEventListener("click",e=>{if(e.target.id==="modalPegarExcel")cerrarPegarExcel()});
$("#textoPegarExcel").addEventListener("input",()=>$("#errorPegarExcel").textContent="");
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
configurarCentrosCostos();
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
else if(pagina==="centros-costos"){$("#paginaCentrosCostos").classList.add("active");$("#breadcrumbActual").textContent="Carga de archivos"}
else{$("#paginaDirectorio").classList.add("active");$("#breadcrumbActual").textContent="Directorio"}
}
function configurarCentrosCostos(){
const panel=$("#panelCentrosCostos");
$("#agregarVistaArchivo").addEventListener("click",agregarVistaArchivo);
$("#limpiarCentrosCostos").addEventListener("click",limpiarCentrosCostos);
panel.addEventListener("click",()=>panel.focus());
panel.addEventListener("dragover",e=>{e.preventDefault();panel.classList.add("drag-over")});
panel.addEventListener("dragleave",()=>panel.classList.remove("drag-over"));
panel.addEventListener("drop",e=>{
e.preventDefault();
panel.classList.remove("drag-over");
const archivo=[...e.dataTransfer.files].find(f=>/\.(xlsx|xls|csv)$/i.test(f.name));
if(archivo){leerArchivoCentrosCostos(archivo);return}
const texto=e.dataTransfer.getData("text/plain");
if(texto)recibirRangoCostos(texto);
});
panel.addEventListener("paste",e=>{
const texto=e.clipboardData.getData("text/plain");
if(texto){e.preventDefault();recibirRangoCostos(texto)}
});
try{archivosCarga=JSON.parse(localStorage.getItem("archivos_carga")||"null")||[]}catch(error){archivosCarga=[]}
if(!archivosCarga.length){
let anterior=null;try{anterior=JSON.parse(localStorage.getItem("centros_costos_rango")||"null")}catch(error){}
archivosCarga=[{id:`archivo_${Date.now()}`,nombre:"Vista 1",matriz:Array.isArray(anterior)?anterior:[]}];
}
vistaArchivoActual=archivosCarga[0].id;
archivoResumenActual=archivosCarga.find(a=>a.matriz.length)?.id||vistaArchivoActual;
guardarArchivosCarga();renderVistasArchivos();mostrarVistaArchivoActual();actualizarSelectorArchivos();
}
function guardarArchivosCarga(){localStorage.setItem("archivos_carga",JSON.stringify(archivosCarga))}
function archivoCargaActual(){return archivosCarga.find(a=>a.id===vistaArchivoActual)}
function agregarVistaArchivo(){
const numero=archivosCarga.length+1;const archivo={id:`archivo_${Date.now()}_${Math.random().toString(36).slice(2)}`,nombre:`Vista ${numero}`,matriz:[]};
archivosCarga.push(archivo);vistaArchivoActual=archivo.id;guardarArchivosCarga();renderVistasArchivos();mostrarVistaArchivoActual();actualizarSelectorArchivos();
}
function renderVistasArchivos(){
const lista=$("#listaVistasArchivos");lista.innerHTML="";
archivosCarga.forEach(archivo=>{
const boton=document.createElement("button");boton.type="button";boton.className=`vista-archivo${archivo.id===vistaArchivoActual?' active':''}`;boton.textContent=archivo.nombre;boton.title="Clic para abrir · doble clic para cambiar nombre";
boton.addEventListener("click",()=>{if(boton.isContentEditable)return;if(vistaArchivoActual===archivo.id){boton.contentEditable="true";boton.focus();document.getSelection()?.selectAllChildren(boton);return}vistaArchivoActual=archivo.id;renderVistasArchivos();mostrarVistaArchivoActual()});
boton.addEventListener("dblclick",()=>{boton.contentEditable="true";boton.focus();document.getSelection()?.selectAllChildren(boton)});
boton.addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();boton.blur()}if(e.key==="Escape"){boton.textContent=archivo.nombre;boton.blur()}});
boton.addEventListener("blur",()=>{if(!boton.isContentEditable)return;boton.contentEditable="false";archivo.nombre=boton.textContent.trim()||archivo.nombre;boton.textContent=archivo.nombre;guardarArchivosCarga();actualizarSelectorArchivos()});
lista.appendChild(boton);
});
}
function mostrarVistaArchivoActual(){
const archivo=archivoCargaActual();
if(archivo?.matriz?.length){mostrarTablaCentrosCostos(archivo.matriz,false);return}
$("#tablaCentrosCostos thead").innerHTML="";$("#tablaCentrosCostos tbody").innerHTML="";$("#vistaCentrosCostos").classList.add("hidden");
const panel=$("#panelCentrosCostos");panel.classList.remove("recibido","compacto");panel.querySelector("strong").textContent="Arrastra o Pega aquí tus rangos";panel.querySelector("span").textContent="Copia las celdas desde Excel y presiona Ctrl + V";
}
function actualizarSelectorArchivos(){
const select=$("#selectorArchivoResumen");select.innerHTML="";
archivosCarga.filter(a=>a.matriz.length).forEach(a=>{const o=document.createElement("option");o.value=a.id;o.textContent=a.nombre;select.appendChild(o)});
if(!archivosCarga.some(a=>a.id===archivoResumenActual&&a.matriz.length))archivoResumenActual=archivosCarga.find(a=>a.matriz.length)?.id||null;
if(archivoResumenActual)select.value=archivoResumenActual;
}
function recibirRangoCostos(texto){
try{
const matriz=leerRangoExcel(texto);
if(!matriz.length)throw new Error("El rango está vacío.");
mostrarTablaCentrosCostos(matriz);
}catch(error){mostrarToast("No se pudo pegar",error.message,false)}
}
function leerArchivoCentrosCostos(archivo){
const lector=new FileReader();
lector.onload=e=>{
try{
let matriz;
if(/\.csv$/i.test(archivo.name)){
const libro=XLSX.read(e.target.result,{type:"string"});
matriz=XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]],{header:1,defval:"",raw:false});
}
else{
const libro=XLSX.read(new Uint8Array(e.target.result),{type:"array",cellDates:true});
matriz=XLSX.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]],{header:1,defval:"",raw:false});
}
matriz=matriz.filter(f=>f.some(v=>String(v).trim()));
if(!matriz.length)throw new Error("El archivo está vacío.");
mostrarTablaCentrosCostos(matriz);
}catch(error){mostrarToast("No se pudo abrir",error.message,false)}
};
if(/\.csv$/i.test(archivo.name))lector.readAsText(archivo);
else lector.readAsArrayBuffer(archivo);
}
function mostrarTablaCentrosCostos(matriz,guardar=true){
const encabezados=matriz[0];
const cuerpo=matriz.slice(1);
const thead=$("#tablaCentrosCostos thead");
const tbody=$("#tablaCentrosCostos tbody");
thead.innerHTML="";tbody.innerHTML="";
const trHead=document.createElement("tr");
encabezados.forEach(valor=>{const th=document.createElement("th");th.textContent=valor;trHead.appendChild(th)});
thead.appendChild(trHead);
cuerpo.forEach(fila=>{
const tr=document.createElement("tr");
encabezados.forEach((_,i)=>{const td=document.createElement("td");td.textContent=fila[i]??"";tr.appendChild(td)});
tbody.appendChild(tr);
});
const columnasRango=encabezados.length;
$("#resumenCentrosCostos").textContent=`${cuerpo.length} filas · ${columnasRango} columnas`;
$("#vistaCentrosCostos").classList.remove("hidden");
const panel=$("#panelCentrosCostos");
panel.classList.add("recibido");
panel.classList.add("compacto");
panel.querySelector("strong").textContent="Arrastra o pega otro rango";
panel.querySelector("span").textContent="El nuevo rango reemplazará esta tabla";
if(guardar){const archivo=archivoCargaActual();if(archivo){archivo.matriz=matriz;archivoResumenActual=archivo.id;guardarArchivosCarga();actualizarSelectorArchivos()}}
actualizarResumen();
if(guardar)mostrarToast("Rango recibido",`${cuerpo.length} filas y ${columnasRango} columnas.`,true);
}
function limpiarCentrosCostos(){
const archivo=archivoCargaActual();if(archivo){archivo.matriz=[];guardarArchivosCarga()}
$("#tablaCentrosCostos thead").innerHTML="";
$("#tablaCentrosCostos tbody").innerHTML="";
$("#vistaCentrosCostos").classList.add("hidden");
const panel=$("#panelCentrosCostos");
panel.classList.remove("recibido","compacto");
panel.querySelector("strong").textContent="Arrastra o Pega aquí tus rangos";
panel.querySelector("span").textContent="Copia las celdas desde Excel y presiona Ctrl + V";
actualizarResumen();
actualizarSelectorArchivos();
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
function abrirPegarExcel(){
$("#textoPegarExcel").value="";
$("#errorPegarExcel").textContent="";
$("#modalPegarExcel").classList.remove("hidden");
setTimeout(()=>$("#textoPegarExcel").focus(),0);
}
function cerrarPegarExcel(){
$("#modalPegarExcel").classList.add("hidden");
$("#textoPegarExcel").value="";
$("#errorPegarExcel").textContent="";
}
function leerRangoExcel(texto){
const filas=[];
let fila=[],celda="",entreComillas=false;
for(let i=0;i<texto.length;i++){
const caracter=texto[i];
if(caracter==='"'){
if(entreComillas&&texto[i+1]==='"'){celda+='"';i++}
else entreComillas=!entreComillas;
}else if(caracter==="\t"&&!entreComillas){fila.push(celda);celda=""}
else if((caracter==="\n"||caracter==="\r")&&!entreComillas){
if(caracter==="\r"&&texto[i+1]==="\n")i++;
fila.push(celda);filas.push(fila);fila=[];celda="";
}else celda+=caracter;
}
if(entreComillas)throw new Error("El rango contiene comillas sin cerrar.");
if(fila.length||celda)filas.push([...fila,celda]);
return filas.filter(f=>f.some(v=>String(v).trim()));
}
function agregarDatosPegados(){
try{
const matriz=leerRangoExcel($("#textoPegarExcel").value);
if(matriz.length<2)throw new Error("Incluye los encabezados y al menos una fila de datos.");
const encabezados=matriz[0].map(v=>String(v).trim());
if(encabezados.some(v=>!v))throw new Error("Todas las columnas deben tener un encabezado.");
if(new Set(encabezados.map(normalizar)).size!==encabezados.length)throw new Error("Hay encabezados repetidos.");
const existentes=new Map(columnas[vistaActual].map(c=>[normalizar(c),c]));
const nombres=encabezados.map(h=>existentes.get(normalizar(h))||h);
const nuevasColumnas=nombres.filter(h=>!columnas[vistaActual].includes(h));
const nuevasFilas=matriz.slice(1).map(fila=>{
const registro={__id:`local_${Date.now()}_${Math.random().toString(36).slice(2)}`};
nombres.forEach((nombre,i)=>registro[nombre]=String(fila[i]??""));
return registro;
});
columnas[vistaActual].push(...nuevasColumnas);
registrosLocales[vistaActual].push(...nuevasFilas);
ordenFilas[vistaActual].push(...nuevasFilas.map(r=>r.__id));
reconstruirDatos(vistaActual);
guardarLocalStorage();
renderTabla();
actualizarResumen();
cerrarPegarExcel();
mostrarToast("Datos pegados",`${nuevasFilas.length} registros y ${nuevasColumnas.length} columnas agregados.`,true);
}catch(error){$("#errorPegarExcel").textContent=error.message}
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
actualizarSelectorArchivos();
const matriz=archivosCarga.find(a=>a.id===archivoResumenActual)?.matriz||null;
const vacio=$("#resumenCostosVacio");
const dashboard=$("#dashboardCostos");
if(!Array.isArray(matriz)||matriz.length<2){vacio.classList.remove("hidden");dashboard.classList.add("hidden");return}
const analisis=analizarCentrosCostos(matriz);
renderTablasCuentas(matriz);
vacio.classList.add("hidden");dashboard.classList.remove("hidden");
const aviso=$("#avisoResumenCostos");
if(analisis.aviso){aviso.textContent=analisis.aviso;aviso.classList.remove("hidden")}else aviso.classList.add("hidden");
$("#resumenIngresos").textContent=formatearDinero(analisis.ingresos);
$("#resumenEgresos").textContent=formatearDinero(analisis.egresos);
const resultado=analisis.ingresos-analisis.egresos;
$("#resumenResultado").textContent=formatearDinero(resultado);
$("#resumenResultado").closest(".metrica-costos").classList.toggle("negativo",resultado<0);
$("#cantidadIngresos").textContent=`${analisis.cantidadIngresos} cuentas de detalle`;
$("#cantidadEgresos").textContent=`${analisis.cantidadEgresos} cuentas de detalle`;
renderGraficoCategorias(analisis.categorias,analisis.ingresos,analisis.egresos);
renderComposicion(analisis.ingresos,analisis.egresos);
}
function cambiarVistaResumen(vista){
$$('.vista-resumen').forEach(b=>b.classList.toggle('active',b.dataset.resumen===vista));
[['tablas','vistaResumenTablas'],['categorias','vistaResumenCategorias'],['balance','vistaResumenBalance']].forEach(([nombre,id])=>$("#"+id).classList.toggle('hidden',nombre!==vista));
}
function indiceValorCostos(headers,filas,excluidos=[]){
const nombres=headers.map(normalizar);
for(const palabra of ['valor','saldo','monto','total','costo','importe','debe','egreso']){
const i=nombres.findIndex((h,j)=>!excluidos.includes(j)&&(h===palabra||h.includes(palabra)));
if(i>=0)return i;
}
let indice=-1,mejor=0;
headers.forEach((_,i)=>{if(excluidos.includes(i))return;const proporcion=filas.filter(f=>Number.isFinite(numeroContable(f[i]))).length/Math.max(filas.length,1);if(proporcion>mejor){indice=i;mejor=proporcion}});
return indice;
}
function nombreSinCodigo(valor){return String(valor??'').trim().replace(/^\s*[45](?:[.\d-]+)*\s*[-–:]?\s+(?=[A-Za-zÁÉÍÓÚÑáéíóúñ])/, '').trim()}
function cuentasParaTablas(matriz){
const headers=matriz[0].map(v=>String(v).trim());
const nombres=headers.map(normalizar);
const filas=matriz.slice(1).filter(f=>f.some(v=>String(v??'').trim()));
const columnas=[3,4,5].map(n=>nombres.findIndex(h=>new RegExp(`(?:nivel|jerarquia)\\s*${n}(?:\\D|$)`).test(h)));
const codigo=nombres.findIndex(h=>/codigo|^cod$/.test(h));
const cuenta=nombres.findIndex(h=>h==='cuenta');
const cuentas=new Map();
const tipos=new Map();
let principal='',subcuenta='',tipo='';
filas.forEach(fila=>{
if(cuenta<0||columnas.some(i=>i<0))return;
const nombre=nombreSinCodigo(fila[cuenta]);
if(!nombre)return;
const presentes=columnas.map(i=>String(fila[i]??'').trim());
const nivel=presentes.findIndex(v=>Number.isFinite(numeroContable(v)));
if(nivel<0)return;
const codigoFila=codigo>=0?String(fila[codigo]??'').trim():String(fila[cuenta]??'').trim();
const clase=codigoFila.match(/^\s*([45])/);
if(nivel===0){principal=nombre;subcuenta='';tipo=clase?clase[1]:'';tipos.set(principal,tipo);return}
if(nivel===1){if(principal)subcuenta=nombre;return}
if(!principal||!subcuenta)return;
if(!tipo&&clase){tipo=clase[1];tipos.set(principal,tipo)}
const monto=numeroContable(fila[columnas[2]]);
if(!Number.isFinite(monto))return;
if(!cuentas.has(principal))cuentas.set(principal,new Map());
const subs=cuentas.get(principal);
if(!subs.has(subcuenta))subs.set(subcuenta,[]);
subs.get(subcuenta).push({detalle:nombre,valor:monto});
});
return{cuentas,tipos,detectado:columnas.every(i=>i>=0)&&cuenta>=0};
}
function renderTablasCuentas(matriz){
const contenedor=$("#tablasCuentasCostos");contenedor.innerHTML='';
const {cuentas,tipos,detectado}=cuentasParaTablas(matriz);
if(!detectado||!cuentas.size){
const aviso=document.createElement('div');aviso.className='resumen-aviso';
aviso.textContent=!detectado?'Para crear las tablas necesito Cuenta, Nivel 3, Nivel 4 y Nivel 5.':'No encontré detalles con valor numérico en Nivel 5 bajo una cuenta y subcuenta.';
contenedor.appendChild(aviso);return;
}
for(const [principal,subs] of cuentas){
const tipo=tipos.get(principal)||'';
const tarjeta=document.createElement('section');tarjeta.className=`tabla-cuenta-card ${tipo==='4'?'cuenta-ingreso':tipo==='5'?'cuenta-gasto':''}`;
const titulo=document.createElement('div');titulo.className='tabla-cuenta-titulo';titulo.textContent=principal;
const scroll=document.createElement('div');scroll.className='tabla-cuenta-scroll';
const tabla=document.createElement('table');tabla.className='tabla-cuenta';
const thead=document.createElement('thead');const encabezado=document.createElement('tr');
['Subcuenta','Detalle','Valor'].forEach(t=>{const th=document.createElement('th');th.textContent=t;encabezado.appendChild(th)});thead.appendChild(encabezado);
const tbody=document.createElement('tbody');
for(const [subcuenta,detalles] of subs){
detalles.forEach((item,i)=>{
const tr=document.createElement('tr');
if(i===0){const td=document.createElement('td');td.className='subcuenta-combinada';td.rowSpan=detalles.length;td.textContent=subcuenta;tr.appendChild(td)}
const detalle=document.createElement('td');detalle.textContent=item.detalle;
const monto=document.createElement('td');monto.className='valor-cuenta';monto.textContent=formatearDinero(item.valor);
tr.append(detalle,monto);tbody.appendChild(tr);
});
}
tabla.append(thead,tbody);scroll.appendChild(tabla);tarjeta.append(titulo,scroll);contenedor.appendChild(tarjeta);
}
}
function analizarCentrosCostos(matriz){
const estructura=cuentasParaTablas(matriz);
if(estructura.detectado){
let ingresos=0,egresos=0,cantidadIngresos=0,cantidadEgresos=0,desconocidas=0;
const categorias=[];
for(const [principal,subs] of estructura.cuentas){
const tipo=estructura.tipos.get(principal)||'';
for(const [nombre,detalles] of subs){
const valor=detalles.reduce((s,d)=>s+Math.abs(d.valor),0);
categorias.push({nombre:`${principal} (${nombre})`,tipo,valor});
detalles.forEach(d=>{if(tipo==='4'){ingresos+=Math.abs(d.valor);cantidadIngresos++}else if(tipo==='5'){egresos+=Math.abs(d.valor);cantidadEgresos++}else desconocidas++});
}
}
categorias.sort((a,b)=>b.valor-a.valor);
return{ingresos,egresos,cantidadIngresos,cantidadEgresos,categorias,aviso:desconocidas?'Algunas cuentas no tienen código inicial 4 o 5; aparecen en tablas, pero no se incluyen en el balance.':''};
}
const headers=matriz[0].map(v=>String(v).trim());
const filas=matriz.slice(1).filter(f=>f.some(v=>String(v??"").trim()));
const nombres=headers.map(normalizar);
let niveles=nombres.map((h,i)=>({h,i,n:(h.match(/\d+/)||[999])[0]})).filter(x=>/nivel|jerarquia/.test(x.h)).sort((a,b)=>Number(a.n)-Number(b.n)).map(x=>x.i);
const indiceCodigo=nombres.findIndex(h=>/^(codigo|cod|codigo cuenta|cuenta codigo)$/.test(h));
const palabrasValor=["valor","saldo","monto","total","costo","importe","debe","egreso"];
let indiceValor=-1;
for(const palabra of palabrasValor){indiceValor=nombres.findIndex(h=>h===palabra||h.includes(palabra));if(indiceValor>=0)break}
if(indiceValor<0){
let mejor=0;
headers.forEach((_,i)=>{if(i===indiceCodigo||niveles.includes(i))return;const proporcion=filas.filter(f=>Number.isFinite(numeroContable(f[i]))).length/Math.max(filas.length,1);if(proporcion>mejor){mejor=proporcion;indiceValor=i}});
}
const indiceDescripcion=nombres.findIndex(h=>/descripcion|nombre|detalle|concepto/.test(h));
if(!niveles.length&&indiceDescripcion>=0)niveles=[indiceDescripcion];
if(!niveles.length&&indiceCodigo>=0)niveles=[indiceCodigo];
const contextoNiveles=[];
const registros=filas.map((fila,orden)=>{
if(niveles.length>1){
const presentes=niveles.map(indice=>String(fila[indice]??"").trim());
const primero=presentes.findIndex(Boolean);
if(primero>=0){contextoNiveles.length=primero;presentes.forEach((valor,nivel)=>{if(valor)contextoNiveles[nivel]=valor});contextoNiveles.length=presentes.reduce((ultimo,valor,nivel)=>valor?nivel+1:ultimo,primero)}
}
const ruta=niveles.length>1?contextoNiveles.filter(Boolean):niveles.map(i=>String(fila[i]??"").trim()).filter(Boolean);
const codigo=indiceCodigo>=0?String(fila[indiceCodigo]??"").trim():ruta.join(" ");
const coincidencia=(codigo+" "+ruta.join(" ")).trim().match(/^\s*([45])/);
return{fila,ruta,codigo,tipo:coincidencia?coincidencia[1]:"",valor:indiceValor>=0?numeroContable(fila[indiceValor]):NaN,orden};
}).filter(r=>r.ruta.length&&r.tipo&&Number.isFinite(r.valor));
const hojas=registros.filter((r,i)=>!registros.some((otra,j)=>j!==i&&otra.ruta.length>r.ruta.length&&r.ruta.every((v,k)=>normalizar(v)===normalizar(otra.ruta[k]))));
const base=hojas.length?hojas:registros;
const mapa=new Map();let ingresos=0,egresos=0,cantidadIngresos=0,cantidadEgresos=0;
base.forEach(r=>{
const valor=Math.abs(r.valor);
if(r.tipo==="4"){ingresos+=valor;cantidadIngresos++}else{egresos+=valor;cantidadEgresos++}
const categoria=r.ruta[1]||r.ruta[0]||"Sin categoría";
const clave=`${r.tipo}|${categoria}`;
if(!mapa.has(clave))mapa.set(clave,{nombre:categoria,tipo:r.tipo,valor:0});
mapa.get(clave).valor+=valor;
});
const categorias=[...mapa.values()].sort((a,b)=>b.valor-a.valor);
let aviso="";
if(indiceValor<0)aviso="No pude identificar una columna de valores. Usa un encabezado como Valor, Saldo, Monto, Total o Costo.";
else if(!registros.length)aviso="No encontré cuentas con códigos que comiencen en 4 o 5. Revisa la columna Código y los niveles contables.";
else if(!nombres.some(h=>/nivel|jerarquia/.test(h)))aviso="No encontré columnas llamadas Nivel; el agrupamiento se realizó con la descripción o el código disponible.";
return{ingresos,egresos,cantidadIngresos,cantidadEgresos,categorias,aviso};
}
function numeroContable(valor){
if(typeof valor==="number")return valor;
let texto=String(valor??"").trim();if(!texto)return NaN;
const negativo=/^\(.*\)$/.test(texto)||texto.startsWith("-");
texto=texto.replace(/[^\d,.-]/g,"").replace(/^-/,"");
if(texto.includes(",")&&texto.includes("."))texto=texto.lastIndexOf(",")>texto.lastIndexOf(".")?texto.replace(/\./g,"").replace(",","."):texto.replace(/,/g,"");
else if(texto.includes(","))texto=/,\d{1,2}$/.test(texto)?texto.replace(",","."):texto.replace(/,/g,"");
const numero=Number(texto);return Number.isFinite(numero)?(negativo?-numero:numero):NaN;
}
function formatearDinero(valor){return new Intl.NumberFormat("es-EC",{style:"currency",currency:"USD",minimumFractionDigits:2,maximumFractionDigits:2}).format(valor||0)}
function renderGraficoCategorias(categorias,ingresos,egresos){
const grupos=[["4","#graficoIngresosCategorias"],["5","#graficoGastosCategorias"]];
const maximo=Math.max(ingresos,egresos,1);
$("#totalComparativaIngresos").textContent=formatearDinero(ingresos);
$("#totalComparativaGastos").textContent=formatearDinero(egresos);
$("#barraComparativaIngresos").style.width=`${ingresos/maximo*100}%`;
$("#barraComparativaGastos").style.width=`${egresos/maximo*100}%`;
const total=$("#totalGastosCategoria");total.innerHTML="";
const etiqueta=document.createElement("strong");etiqueta.textContent="TOTAL";
const valorTotal=document.createElement("span");valorTotal.textContent=formatearDinero(egresos);
total.append(etiqueta,valorTotal);
grupos.forEach(([tipo,selector])=>{
const grafico=$(selector);grafico.innerHTML="";
const elementos=categorias.filter(c=>c.tipo===tipo).sort((a,b)=>b.valor-a.valor);
if(!elementos.length){const p=document.createElement("p");p.className="resumen-sin-datos";p.textContent=tipo==="4"?"No hay ingresos para mostrar.":"No hay gastos para mostrar.";grafico.appendChild(p);return}
elementos.forEach(c=>{
const item=document.createElement("div");item.className=`barra-costo ${c.tipo==="4"?"ingreso":c.tipo==="5"?"egreso":"desconocido"}`;
const cabecera=document.createElement("div");cabecera.className="barra-costo-cabecera";
const nombre=document.createElement("span");nombre.textContent=c.nombre;nombre.title=c.nombre;
const partes=c.nombre.match(/^(.*?)(\s*\([^()]+\))$/);
if(partes){nombre.textContent=partes[1];const detalle=document.createElement("strong");detalle.className="nombre-categoria-detalle";detalle.textContent=partes[2];nombre.appendChild(detalle)}
const valor=document.createElement("strong");valor.textContent=formatearDinero(c.valor);
cabecera.append(nombre,valor);
const pista=document.createElement("div");pista.className="barra-costo-pista";
const relleno=document.createElement("div");relleno.className="barra-costo-relleno";relleno.style.width=`${c.valor/maximo*100}%`;
pista.appendChild(relleno);item.append(cabecera,pista);grafico.appendChild(item);
});
});
}
function renderComposicion(ingresos,egresos){
const total=ingresos+egresos;const porcentaje=total?ingresos/total*100:0;
$("#graficoComposicion").style.background=`conic-gradient(#3d9b68 0 ${porcentaje}%,#d36a62 ${porcentaje}% 100%)`;
const leyenda=$("#leyendaComposicion");leyenda.innerHTML="";
[["Ingresos",ingresos,"#3d9b68"],["Egresos",egresos,"#d36a62"]].forEach(([nombre,valor,color])=>{
const fila=document.createElement("div");fila.className="leyenda-item";
const etiqueta=document.createElement("span");const punto=document.createElement("i");punto.className="leyenda-color";punto.style.background=color;etiqueta.append(punto,document.createTextNode(nombre));
const dato=document.createElement("strong");dato.textContent=total?`${(valor/total*100).toFixed(1)}%`:"0%";fila.append(etiqueta,dato);leyenda.appendChild(fila);
});
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
function exportarContenido(){
const contenido={formato:"gestion-empresarial",version:1,fecha:new Date().toISOString(),datos:{
archivosCarga,
directorioRegistros:registrosLocales,
directorioColumnas:columnas,
directorioOrden:ordenFilas
}};
const blob=new Blob([JSON.stringify(contenido,null,2)],{type:"application/json"});
const url=URL.createObjectURL(blob);const enlace=document.createElement("a");
enlace.href=url;enlace.download=`gestion-empresarial-${new Date().toISOString().slice(0,10)}.json`;
document.body.appendChild(enlace);enlace.click();enlace.remove();
setTimeout(()=>URL.revokeObjectURL(url),1000);
$("#menuOpcionesContenido").classList.add("hidden");$("#btnOpcionesContenido").setAttribute("aria-expanded","false");
mostrarToast("Contenido exportado","Se descargó el archivo JSON.",true);
}
async function importarContenido(e){
const archivo=e.target.files[0];e.target.value="";if(!archivo)return;
try{
const contenido=JSON.parse(await archivo.text());
if(contenido.formato!=="gestion-empresarial"||contenido.version!==1||!contenido.datos||!Array.isArray(contenido.datos.archivosCarga))throw new Error("El archivo no es una exportación válida del sistema.");
const carga=contenido.datos.archivosCarga;
if(!carga.every(a=>a&&typeof a.id==="string"&&typeof a.nombre==="string"&&Array.isArray(a.matriz)&&a.matriz.every(f=>Array.isArray(f))))throw new Error("Las vistas del archivo no tienen un formato válido.");
for(const clave of ["directorioRegistros","directorioColumnas","directorioOrden"]){if(!contenido.datos[clave]||typeof contenido.datos[clave]!=="object"||Array.isArray(contenido.datos[clave]))throw new Error("Faltan datos del Directorio.")}
localStorage.setItem("archivos_carga",JSON.stringify(carga));
localStorage.setItem("directorio_registros",JSON.stringify(contenido.datos.directorioRegistros));
localStorage.setItem("directorio_columnas",JSON.stringify(contenido.datos.directorioColumnas));
localStorage.setItem("directorio_orden",JSON.stringify(contenido.datos.directorioOrden));
location.reload();
}catch(error){mostrarToast("No se pudo importar",error.message,false)}
}
