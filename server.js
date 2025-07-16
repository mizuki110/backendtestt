app.get('/api/roblox/user/:username', async (req, res) => {
  try {
    const username = req.params.username;
    
    // First, get the user ID from the username
    const userResponse = await axios.post(
      'https://users.roblox.com/v1/usernames/users',
      { usernames: [username], excludeBannedUsers: false }
    );

    // Check if the user exists
    if (!userResponse.data?.data?.[0]) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userId = userResponse.data.data[0].id;

    // Run all other API calls in parallel for speed
    const [
      profileResponse,
      pfpResponse,
      friendsResponse,
      followersResponse,
      followingResponse
    ] = await Promise.all([
      axios.get(`https://users.roblox.com/v1/users/${userId}`),
      axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`),
      axios.get(`https://friends.roblox.com/v1/users/${userId}/friends/count`),
      axios.get(`https://friends.roblox.com/v1/users/${userId}/followers/count`),
      axios.get(`https://friends.roblox.com/v1/users/${userId}/followings/count`)
    ]);

    // Combine the data from all responses
    const userData = {
      id: userId,
      name: profileResponse.data.name,
      displayName: profileResponse.data.displayName || username,
      description: profileResponse.data.description || '',
      created: profileResponse.data.created,
      isBanned: profileResponse.data.isBanned || false,
      profilePicture: pfpResponse.data?.data?.[0]?.imageUrl || '',
      friendsCount: friendsResponse.data?.count || 0,
      followersCount: followersResponse.data?.count || 0,
      followingCount: followingResponse.data?.count || 0
    };

    res.json(userData);

  } catch (error) {
    // Log the detailed error on the server for debugging
    console.error('Error fetching Roblox data:', error.message);
    
    // Send a generic error to the client
    res.status(500).json({ error: 'Failed to fetch user data. The user may not exist or the Roblox API is unavailable.' });
  }
});
