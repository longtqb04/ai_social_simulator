import { useState, useRef, useEffect } from "react";
import { AppBar, Toolbar, Typography, Button, Box, TextField, Paper, Card, CardContent, LinearProgress, Select, MenuItem, FormControl, InputLabel } from "@mui/material";
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

const TypingDots = () => (
  <Box sx={{
    display: "flex",
    gap: "4px",
    alignItems: "center",
    p: 1,
    bgcolor: "grey.200",
    width: "50px",
    borderRadius: 3,
  }}>
    <Box sx={{
      width: 8,
      height: 8,
      bgcolor: "grey.500",
      borderRadius: "50%",
      animation: "typing 1.4s infinite",
      "@keyframes typing": {
        "0%": { opacity: 0.2 },
        "20%": { opacity: 1 },
        "100%": { opacity: 0.2 },
      },
    }} />

    <Box sx={{
      width: 8,
      height: 8,
      bgcolor: "grey.500",
      borderRadius: "50%",
      animation: "typing 1.4s infinite 0.2s",
    }} />

    <Box sx={{
      width: 8,
      height: 8,
      bgcolor: "grey.500",
      borderRadius: "50%",
      animation: "typing 1.4s infinite 0.4s",
    }} />
  </Box>
);

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);
  const [mode, setMode] = useState("behavioral");
  const [interviewActive, setInterviewActive] = useState(false);
  const [finalSummary, setFinalSummary] = useState(null);

  const endInterview = async () => {
    setInterviewActive(false);
    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/api/end", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ history: messages }),
      });

      const data = await res.json();
      setFinalSummary(data.summary);
    } catch (err) {
      console.error("End interview error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  const startInterview = () => {
    setInterviewActive(true);
    setFinalSummary(null);

    setMessages([
      { role: "ai", text: "Can you introduce yourself?" }
    ]);

    setFeedback(null);
  };

  const handleSend = () => {
    if (!interviewActive) return;
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
            mode: mode,
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
          <FormControl sx={{ minWidth: 160, mr: 2 }}>
            <InputLabel>Mode</InputLabel>
            <Select value={mode} label="Mode" onChange={(e) => setMode(e.target.value)}>
              <MenuItem value="behavioral">Behavioral</MenuItem>
              <MenuItem value="technical">Technical</MenuItem>
              <MenuItem value="system_design">System Design</MenuItem>
              <MenuItem value="frontend">Frontend</MenuItem>
              <MenuItem value="backend">Backend</MenuItem>
              <MenuItem value="ai">AI</MenuItem>
            </Select>
          </FormControl>
          <Button color="inherit" onClick={interviewActive ? endInterview : startInterview}>
            {interviewActive ? "End" : "Start"}
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main */}
      <Box sx={{ display: "flex", flex: 1 }}>
        {/* Chat */}
        <Box ref={chatRef} sx={{ flex: 2, p: 2, overflowY: "auto", display: "flex", flexDirection: "column", justifyContent: "flex-start", minHeight: 0, maxHeight: "100%", scrollBehavior: "smooth",}}>
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

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "flex-start", mb: 1 }}>
              <Paper
                sx={{
                  p: 1.5,
                  maxWidth: "60%",
                  bgcolor: "grey.200",
                  borderRadius: 5,
                  textAlign: "left"
                }}
              >
                <TypingDots />
              </Paper>
            </Box>
          )}
        </Box>

        {/* Feedback */}
        <Box sx={{ flex: 1, p: 2, borderLeft: "1px solid black" }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Feedback</Typography>

              {finalSummary ? (
                <>
                <Typography variant="h6" sx={{ mt: 2 }}>
                  Final Summary
                </Typography>

                <Typography sx={{ mt: 1 }}>
                  <strong>Overall Score:</strong> {finalSummary.score}/10
                </Typography>

                <Typography sx={{ mt: 1 }}>
                  <strong>Strengths:</strong> {finalSummary.strengths}
                </Typography>

                <Typography sx={{ mt: 1 }}>
                  <strong>Weaknesses:</strong> {finalSummary.weaknesses}
                </Typography>

                <Typography sx={{ mt: 1 }}>
                  <strong>Verdict:</strong> {finalSummary.verdict}
                </Typography>
                </>
              ) : feedback ? (
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
        <Button
          variant="contained"
          sx={{
            ml: 2,
            bgcolor: "primary.main",
            boxShadow: 2,
            transition: "all 0.25s ease",
            "&:hover": {
              bgcolor: "primary.dark",
              boxShadow: 4,
              transform: "translateY(-2px)",
            }
          }}
          onClick={handleSend}
        >
          <ArrowForwardIcon />
        </Button>
      </Box>
    </Box>
    </ThemeProvider>
  );
}

export default App;