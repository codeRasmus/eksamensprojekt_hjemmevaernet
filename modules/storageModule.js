export async function storeDataLocal() {
    try {
        if (temp.response.ok) {
            let data = await temp.response.json();

            // Store data and timestamps in local storage
            localStorage.setItem("chatGPTResponse", JSON.stringify(response));
            localStorage.setItem("lastModified", response.timestamp);

            console.log(data);
        }
    }
    catch (error) {
        console.error("Fetch error:", error);
    }
    console.log("Data stored in local storage:", temp.response);
}