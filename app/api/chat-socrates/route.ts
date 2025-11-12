import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Parse incoming message and optional conversation history
    const { message, conversation } = await request.json()

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Invalid request: message missing or invalid" }, { status: 400 })
    }

    // Retain only the last few messages for lightweight context
    const contextMessages =
      Array.isArray(conversation) && conversation.length > 0
        ? conversation.slice(-6).map((msg) => ({
            role: msg.sender === "user" ? "user" : "assistant",
            content: msg.content,
          }))
        : []

    // Construct the API payload
    const payload = {
      model: "llama-4-maverick",
      messages: [
        {
          role: "system",
          content: `You are Socrates AI, a wise, patient teacher who guides students to think deeply and reason clearly.
          
          • Encourage reflection and self-discovery rather than direct answers.
          • Be context-aware: recall earlier parts of the conversation when helpful.
          • Ask short guiding questions that provoke thought, but clarify when necessary.
          • Use analogies and real-world examples to make ideas intuitive.
          • When the student is confused, restate their idea gently and suggest next reasoning steps.
          • Be concise, warm, and respectful — never condescending or evasive.
          • Limit responses to 4 sentences maximum.`,
        },
        ...contextMessages,
        {
          role: "user",
          content: message,
        },
      ],
      max_tokens: 250,
      temperature: 0.7,
    }

    // Send request to Hack Club AI endpoint
    const response = await fetch("https://ai.hackclub.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer hackclub",
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Hack Club AI returned status ${response.status}`)
    }

    const data = await response.json()
    const reply =
      data?.choices?.[0]?.message?.content ||
      "I apologize, but I cannot respond right now. Please try again later."

    // Here we return Socrates AI’s response
    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Error in Socrates AI route:", error)
    return NextResponse.json({ error: "Internal server error: failed to get response from Socrates" }, { status: 500 })
  }
}
