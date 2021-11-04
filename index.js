function OnButtonClick() {
    var inputField = document.getElementById("alertBox");
    
    if(inputField.value == "") {
        alert("Please enter something into the input field!")
        inputField.focus();
    } else {
        alert(inputField.value);
    }
}