(function(){
let cliente=null,listo=false,temporizador=null,guardando=Promise.resolve(),ultimoError="";
const FILA_COMPARTIDA="principal";
const ids={archivosCarga:"archivos_carga",directorioRegistros:"directorio_registros",directorioColumnas:"directorio_columnas",directorioOrden:"directorio_orden"};
const leerLocal=()=>Object.fromEntries(Object.entries(ids).map(([campo,clave])=>{try{return[campo,JSON.parse(localStorage.getItem(clave)||(campo==="archivosCarga"?"[]":"{}"))]}catch(e){return[campo,campo==="archivosCarga"?[]:{}]}}));
function estado(texto,clase=""){const boton=document.querySelector("#btnSupabase");if(!boton)return;boton.textContent=texto;boton.classList.remove("conectado","error");if(clase)boton.classList.add(clase)}
function mostrarError(error){console.error("Supabase:",error);ultimoError=error.message||String(error);estado("Error de conexión","error");const boton=document.querySelector("#btnSupabase");if(boton)boton.title=ultimoError;if(typeof mostrarToast==="function")mostrarToast("Error de Supabase",ultimoError,false)}
function iguales(a,b){if(a===b)return true;if(!a||!b||typeof a!=="object"||typeof b!=="object")return false;const ca=Object.keys(a).sort(),cb=Object.keys(b).sort();return ca.length===cb.length&&ca.every((k,i)=>k===cb[i]&&iguales(a[k],b[k]))}
async function guardarRemoto(){
if(!listo)return;
const local=leerLocal();
const fila={id:FILA_COMPARTIDA,archivos_carga:local.archivosCarga,directorio_registros:local.directorioRegistros,directorio_columnas:local.directorioColumnas,directorio_orden:local.directorioOrden,updated_at:new Date().toISOString()};
const {error}=await cliente.from("app_shared_state").upsert(fila,{onConflict:"id"});
if(error)throw error;
estado("Base sincronizada","conectado");
}
window.programarSincronizacionSupabase=function(){if(!listo)return;clearTimeout(temporizador);temporizador=setTimeout(()=>{guardando=guardando.then(guardarRemoto).catch(mostrarError)},500)};
window.iniciarSupabase=async function(){
const cfg=window.SUPABASE_CONFIG||{};
const boton=document.querySelector("#btnSupabase");
if(boton)boton.addEventListener("click",()=>{if(ultimoError&&typeof mostrarToast==="function")mostrarToast("Error de Supabase",ultimoError,false)});
if(!cfg.url||!cfg.publishableKey||!window.supabase){estado("Configurar base","error");throw new Error("Falta la URL, la clave publicable o la librería supabase-js.")}
cliente=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
estado("Conectando…");
const {data,error}=await cliente.from("app_shared_state").select("archivos_carga,directorio_registros,directorio_columnas,directorio_orden").eq("id",FILA_COMPARTIDA).maybeSingle();
if(error)throw error;
if(!data){listo=true;await guardarRemoto();return}
const remoto={archivosCarga:data.archivos_carga||[],directorioRegistros:data.directorio_registros||{},directorioColumnas:data.directorio_columnas||{},directorioOrden:data.directorio_orden||{}};
const local=leerLocal();listo=true;estado("Base sincronizada","conectado");
if(!iguales(remoto,local)){Object.entries(ids).forEach(([campo,clave])=>localStorage.setItem(clave,JSON.stringify(remoto[campo])));location.reload()}
};
})();
