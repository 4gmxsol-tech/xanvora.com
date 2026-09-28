const cors = {
  "Access-Control-Allow-Origin": "https://xanvora.com",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: cors });
    }

    const url = new URL(request.url);
    if (url.pathname !== "/search" || request.method !== "POST") {
      return json({ error: "Not found" }, 404);
    }

    if (!env.SERPAPI_KEY) {
      return json({ error: "Search connector is not configured." }, 503);
    }

    const incoming = await request.formData();
    const image = incoming.get("image");

    if (!(image instanceof File)) {
      return json({ error: "image file is required" }, 400);
    }

    if (!image.type.startsWith("image/")) {
      return json({ error: "Only image files are accepted" }, 415);
    }

    if (image.size > 500 * 1024) {
      return json({ error: "Image must be 500 KB or smaller for the visual-search connector." }, 413);
    }

    const upload = new FormData();
    upload.append("image", image, image.name || "upload");
    upload.append("api_key", env.SERPAPI_KEY);

    const imageResponse = await fetch("https://serpapi.com/image", {
      method: "POST",
      body: upload,
    });

    const uploaded = await imageResponse.json();
    if (!imageResponse.ok || uploaded.error || !uploaded.image_id) {
      return json({ error: uploaded.error || "Image upload failed" }, 502);
    }

    const params = new URLSearchParams({
      engine: "google_lens",
      image_id: uploaded.image_id,
      type: "all",
      safe: "active",
      api_key: env.SERPAPI_KEY,
    });

    const searchResponse = await fetch(
      "https://serpapi.com/search.json?" + params.toString()
    );
    const data = await searchResponse.json();

    if (!searchResponse.ok || data.error) {
      return json({ error: data.error || "Visual search failed" }, 502);
    }

    return json(normalize(data));
  },
};

function normalize(data) {
  const exact = (data.exact_matches || []).slice(0, 20).map(item => ({
    kind: "exact",
    title: item.title || "",
    source: item.source || "",
    link: item.link || "",
    thumbnail: item.thumbnail || "",
  }));

  const visual = (data.visual_matches || []).slice(0, 20).map(item => ({
    kind: "visual",
    title: item.title || "",
    source: item.source || "",
    link: item.link || "",
    thumbnail: item.thumbnail || "",
  }));

  return {
    engine: "google_lens",
    exact_matches: exact,
    visual_matches: visual,
    text: data.text || "",
    knowledge_graph: data.knowledge_graph || null,
    searched_at: new Date().toISOString(),
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
