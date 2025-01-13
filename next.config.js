module.exports = {
  images: {
    remotePatterns: [
        {
          protocol: 'https',
          hostname: '*.cloudfront.net',
          port: '',
          pathname: '/pictures/athletes/**',
          search: '',
        },
      ],
    },
}