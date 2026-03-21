import { useState } from "react";
import { AppBar, Toolbar, Typography, Button, Box, TextField, Paper, Card, CardContent, LinearProgress } from "@mui/material";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  const startInterview = () => {
    setMessages([{ role: "ai", text: "Can you introduce yourself?" }]);
    setFeedback(null);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };

    // ✅ capture correct values
    const currentInput = input;
    const currentHistory = [...messages, userMessage];

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    setTimeout(async () => {
      try {
        const res = await fetch("http://localhost:3000/api/response", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: currentInput,
            history: currentHistory,
          }),
        });

        const data = await res.json();

        setMessages((prev) => [...prev, data.aiMessage]);
        setFeedback(data.feedback);
      } catch (err) {
        console.error("Frontend error:", err);

        setMessages((prev) => [
          ...prev,
          { role: "ai", text: "Error contacting server." },
        ]);
      } finally {
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", }}>
      {/* Header */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, textAlign: "left" }}>
            AI Interview Simulation
          </Typography>
          <Button color="inherit" onClick={startInterview}>
            Start
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main */}
      <Box sx={{ display: "flex", flex: 1 }}>
        {/* Chat */}
        <Box sx={{ flex: 2, p: 2, overflowY: "auto" }}>
          {messages.filter(Boolean).map((msg, idx) => (
            <Box
              key={idx}
              sx={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                mb: 1
              }}
            >
              <Paper
                sx={{
                  p: 1.5,
                  maxWidth: "60%",
                  bgcolor: msg.role === "user" ? "primary.main" : "grey.200",
                  color: msg.role === "user" ? "white" : "black",
                  borderRadius: 5,
                  textAlign: "left"
                }}
              >
                {msg.text}
              </Paper>
            </Box>
          ))}

          {loading && <Typography>AI is typing...</Typography>}
        </Box>

        {/* Feedback */}
        <Box sx={{ flex: 1, p: 2, borderLeft: "1px solid #ddd" }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Feedback</Typography>

              {feedback ? (
                <>
                  <Typography sx={{ mt: 2 }}>
                    Score: {feedback.score}/10
                  </Typography>

                  <LinearProgress
                    variant="determinate"
                    value={feedback.score * 10}
                    sx={{ my: 1 }}
                  />

                  <Typography>
                    <strong>Comment:</strong> {feedback.comment}
                  </Typography>

                  <Typography>
                    <strong>Suggestion:</strong> {feedback.suggestion}
                  </Typography>
                </>
              ) : (
                <Typography color="text.secondary">
                  No feedback yet
                </Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Input */}
      <Box sx={{ display: "flex", p: 2, borderTop: "1px solid #ddd"}}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your answer..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button variant="contained" sx={{ ml: 2, bgcolor: "primary.main" }} onClick={handleSend}>
          Send
        </Button>
      </Box>
    </Box>
  );
}

export default App;