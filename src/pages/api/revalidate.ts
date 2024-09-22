import { NextApiRequest, NextApiResponse } from "next"
import { getPosts } from "../../apis"
import { CONFIG } from "site.config"

// for all path revalidate, https://<your-site.com>/api/revalidate?secret=<token>
// for specific path revalidate, https://<your-site.com>/api/revalidate?secret=<token>&path=<path>
// example, https://<your-site.com>/api/revalidate?secret=이것은_키&path=feed
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { secret } = req.query
  if (secret !== CONFIG.revalidateSecret) {
    return res.status(401).json({ message: "Invalid token" })
  }

  try {
    const posts = await getPosts()
    const revalidateRequests = posts.map((row) =>
      res.revalidate(`/${row.slug}`)
    )
    await Promise.all(revalidateRequests)
    await res.revalidate("/")

    res.json({ revalidated: true })
  } catch (err) {
    return res.status(500).send("Error revalidating")
  }
}
