let scores = []; // In-memory — resets on each redeploy unless you connect a DB

export default function handler(req, res) {
  if (req.method === "POST") {
    const { name, score } = req.body;

    if (!name || typeof score !== "number") {
      return res.status(400).json({ message: "Invalid request" });
    }

    scores.push({ name, score });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 5); // keep top 5

    return res.status(201).json({ message: "Score saved" });
  }

  if (req.method === "GET") {
    return res.status(200).json(scores);
  }

  return res.status(405).json({ message: "Method not allowed" });
}
