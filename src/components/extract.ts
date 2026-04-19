import type { NextApiRequest, NextApiResponse } from 'next';
import ytdl from 'ytdl-core';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { videoId } = req.query;

  if (!videoId || typeof videoId !== 'string') {
    return res.status(400).json({ error: 'Missing videoId' });
  }

  try {
    // Add a 3 second timeout limit for extraction
    const infoPromise = ytdl.getInfo(videoId);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('YTDL Timeout')), 3000)
    );
    
    const info = await Promise.race([infoPromise, timeoutPromise]) as ytdl.videoInfo;
    const format = ytdl.chooseFormat(info.formats, { filter: 'audioandvideo', quality: 'highest' });
    
    if (format && format.url) {
      return res.status(200).json({ url: format.url });
    } else {
      return res.status(404).json({ error: 'No suitable format found' });
    }
  } catch (error) {
    console.error('YTDL Extraction Error:', error);
    return res.status(500).json({ error: 'Failed to extract video' });
  }
}