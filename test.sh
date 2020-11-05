if [ -z $CACHE ] && [ -d /etc/apt/apt.conf.d ]; then
    printf 'Acquire::HTTP::Proxy "http://apt.network:3142";\nAcquire::HTTPS::Proxy "false";' >> /etc/apt/apt.conf.d/01proxy
fi