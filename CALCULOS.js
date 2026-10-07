function analizarFucion(){
    let nombre = document.getElementById("nombre").value;
    let funcion=document.getElementById("funcion").value;

    let grado=obtenerGrado(funcion);
    document.getElementById("grado").textContent = grado;
}
function obtenerGrado(funcion){
    if (funcion.includes("x^3")){
        return ("funcion de tercer grado");
    }
    if (funcion.includes("x^2")){
        return ("funcion de segundo grado");
    }
    return ("funcion de primer grado");
}