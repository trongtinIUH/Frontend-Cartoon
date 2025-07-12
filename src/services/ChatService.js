import axios from "axios";
import MovieService from "./MovieService"; 


// API key từ biến môi trường
const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

const movieListToPrompt = (movies) => {
  return movies.slice(0, 10).map((movie, index) =>
    `${index + 1}. ![](${movie.thumbnailUrl}) ${movie.title} (${movie.viewCount} lượt xem) - Thể loại: ${movie.genres.join(", ")}`
  ).join("\n");
};
export const sendMessageToGPT = async (message) => {
  // Lấy tên user nếu có
  const userData = localStorage.getItem("my_user");
  const userName = userData ? JSON.parse(userData).userName : "bạn";

  let popularMovies = [];
    try {
      popularMovies = await MovieService.getPopularMovies();
    } catch (err) {
      console.error("Không lấy được danh sách phim nổi bật:", err);
    }

  const top10Text = movieListToPrompt(popularMovies);

  // Lời nhắn system định hướng GPT là trợ lý cho web xem phim
  const systemPrompt = `
Bạn là một trợ lý ảo thân thiện cho trang web xem phim.
Người dùng đang tương tác là "${userName}".
Nhiệm vụ của bạn là:
- Gợi ý phim phù hợp theo yêu cầu người dùng.
- Cung cấp thông tin về các bộ phim nổi bật, bao gồm tên và hình ảnh hiện nhỏ, thể loại và lượt xem trong ${top10Text} .
- Trả lời câu hỏi về thể loại, đạo diễn, diễn viên, hoặc đánh giá phim (nếu có).
- Tránh đưa ra thông tin không chính xác nếu bạn không chắc chắn.
- Trả lời ngắn gọn, rõ ràng và nhiệt tình.
`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Lỗi gửi tin nhắn GPT:", error);
    return "❌ Lỗi khi gọi AI!";
  }
};
