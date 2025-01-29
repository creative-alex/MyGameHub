function handleGameStatusChange(selectElement) {
    const gameId = selectElement.getAttribute("data-game-id");
    const status = selectElement.value;
    const token = localStorage.getItem("authToken"); // Pegamos o token salvo no login

    fetch('/update-game-status', {
        method: 'PATCH',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // Enviamos o token JWT
        },
        body: JSON.stringify({ gameId, status })
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
    })
    .catch(error => console.error('Erro:', error));
}
