import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function parseFilenameWithLLM(filename) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an academic data extraction API. Extract the following from the filename: semester (number 1-8), year (YYYY), examType (strictly "Midterm", "Final", "Quiz", or "Assignment"), and courseCode. 
          Respond ONLY with a valid JSON object matching this schema: {"semester": "string|null", "year": "string|null", "examType": "string|null", "courseCode": "string|null"}.`
        },
        {
          role: "user",
          content: `Filename: "${filename}"`
        }
      ],
      model: "llama3-8b-8192",
      response_format: { type: "json_object" },
      temperature: 0,
      max_tokens: 150,
    });

    const rawContent = chatCompletion.choices[0]?.message?.content;
    if (!rawContent) return {};

    const parsed = JSON.parse(rawContent);

    const validExamTypes = ['Midterm', 'Final', 'Quiz', 'Assignment'];
    
    return {
      semester: parsed.semester ? String(parsed.semester) : null,
      year: parsed.year && parsed.year.length === 4 ? String(parsed.year) : null,
      examType: validExamTypes.includes(parsed.examType) ? parsed.examType : null,
      courseCode: parsed.courseCode ? String(parsed.courseCode).toUpperCase().replace(/\s+/g, '') : null
    };

  } catch (error) {
    console.error("LLM Fallback failed:", error.message);
    return {};
  }
}