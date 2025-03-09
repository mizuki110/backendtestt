const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

app.use(cors({ origin: '*' })); // Allow all origins
app.use(express.json());

app.get('/api/roblox/user/:username', async (req, res) => {
  try {
    const username = req.params.username;
    
    // First API call - Get user ID
    const userResponse = await axios.post(
      'https://users.roblox.com/v1/usernames/users',
      { usernames: [username], excludeBannedUsers: false },
      { headers: { 'Content-Type': 'application/json' } }
    );

    // Check if user exists
    if (!userResponse.data || !userResponse.data.data.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResponse.data.data[0].id;

    // Second API call - Get detailed user info
    const profileResponse = await axios.get(`https://users.roblox.com/v1/users/${userId}`);

    // Third API call - Get user profile picture (PFP)
    const pfpResponse = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`);
    
    // Fourth API call - Get friends count
    const friendsResponse = await axios.get(`https://friends.roblox.com/v1/users/${userId}/friends/count`);

    // Fifth API call - Get followers count
    const followersResponse = await axios.get(`https://friends.roblox.com/v1/users/${userId}/followers/count`);

    // Sixth API call - Get following count
    const followingResponse = await axios.get(`https://friends.roblox.com/v1/users/${userId}/followings/count`);

    // Extract necessary data
    const pfpUrl = pfpResponse.data?.data?.[0]?.imageUrl || '';
    const friendsCount = friendsResponse.data?.count || 0;
    const followersCount = followersResponse.data?.count || 0;
    const followingCount = followingResponse.data?.count || 0;

    // Prepare user data
    const userData = {
      id: userId,
      name: profileResponse.data.name,
      displayName: profileResponse.data.displayName || username,
      description: profileResponse.data.description || '',
      created: profileResponse.data.created,
      isBanned: profileResponse.data.isBanned || false,
      profilePicture: pfpUrl,
      friendsCount: friendsCount,
      followersCount: followersCount,
      followingCount: followingCount
    };

    res.json(userData);
  } catch (error) {
    console.error('Error fetching Roblox data:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.response?.status === 404) {
      res.status(404).json({ error: 'User not found' });
    } else if (error.response?.status === 403) {
      res.status(403).json({ error: 'Access forbidden. API may have rate limits.' });
    } else {
      res.status(500).json({ error: 'Failed to fetch user data. Please try again later.' });
    }
  }
});

app.listen(3001, () => {
  console.log('Server running on port 3001');
});