async function updateGameStatus(gameId, newStatus) {
    if (!gameId) {
        alert("Erro: gameId está indefinido!");
        console.error("Erro: gameId está indefinido!");
        return;
    }

    console.log("Enviando requisição:", { gameId, status: newStatus });

    try {
        const response = await fetch("/user/update-game-status", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("authToken")}`
            },
            body: JSON.stringify({ gameId, status: newStatus })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Erro ao atualizar status: ${errorText}`);
        }

        const data = await response.json();
        alert(data.message);
    } catch (error) {
        console.error("Erro no updateGameStatus:", error);
        alert("Erro ao atualizar o status do jogo.");
    }
}

