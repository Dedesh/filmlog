export function disableBtn(btn) {
    
    btn.disabled = true;
    btn.classList.add("btn-pressed");

};

export function enableBtn(btn) {
    
    btn.disabled = false;
    btn.classList.remove("btn-pressed");

};