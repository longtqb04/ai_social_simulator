import { useState, useRef, useEffect } from "react";
import { AppBar, Toolbar, Typography, Button, Box, TextField, Paper, Card, CardContent, LinearProgress } from "@mui/material";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { createTheme, ThemeProvider, CssBaseline } from "@mui/material";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#303030',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
});

function ScoreBar({ score }) {
  // score is 0-10
  const getColor = (score) => {
    if (score <= 4) return "#f44336";
    if (score <= 7) return "#ff9800";
    return "#4caf50";
  };

  return (
    <LinearProgress
      variant="determinate"
      value={score * 10}
      sx={{
        my: 1,
        height: 5,
        borderRadius: 5,
        "& .MuiLinearProgress-bar": {
          backgroundColor: getColor(score),
        },
        backgroundColor: "black", // gray track
      }}
    />
  );
}

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const startInterview = () => {
    setMessages([{ role: "ai", text: "Can you introduce yourself?" }]);
    setFeedback(null);
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", text: input };

    // Capture correct values
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
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ height: "100vh", display: "flex", flexDirection: "column", }}>
        {/* Header */}
        <AppBar position="static">
          <Toolbar>
            <Typography variant="h6" sx={{ flexGrow: 1, textAlign: "left" }}>
            AI INTERVIEW SIMULATOR
          </Typography>
          <Button color="inherit" onClick={startInterview}>
            Start
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main */}
      <Box sx={{ display: "flex", flex: 1 }}>
        {/* Chat */}
        <Box ref={chatRef} sx={{ flex: 2, p: 2, overflowY: "auto", display: "flex", flexDirection: "column", justifyContent: "flex-end", minHeight: 0, scrollBehavior: "smooth",}}>
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

          {loading && <Typography>AI is asking...</Typography>}
        </Box>

        {/* Feedback */}
        <Box sx={{ flex: 1, p: 2, borderLeft: "1px solid black" }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Feedback</Typography>

              {feedback ? (
                <>
                  <Typography sx={{ mt: 2 }}>
                    <strong>Score: {feedback.score}</strong>/10
                  </Typography>

                  <ScoreBar score={feedback.score}/>

                  <Typography sx={{ textAlign: "left", mb: 1 }}> 
                    <strong>Comment:</strong> {feedback.comment}
                  </Typography>

                  <Typography sx={{ textAlign: "left", mb: 1 }}>
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
      <Box sx={{ display: "flex", p: 2, borderTop: "1px solid black"}}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your answer..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
        />
        <Button variant="contained" sx={{ ml: 2, bgcolor: "primary.main" }} onClick={handleSend}>
          <ArrowForwardIcon />
        </Button>
      </Box>
    </Box>
    </ThemeProvider>
  );
}

export default App;