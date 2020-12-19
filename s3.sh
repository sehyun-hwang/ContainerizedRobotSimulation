  curl -v -X PUT -d '{"foo":123}' \
    -H "Referer: https://www.hwangsehyun.com/" \
    -H "Content-Type: application/json" \
    -H "x-amz-acl: public-read" \
    "https://hwangsehyun.s3-ap-southeast-1.amazonaws.com/robot/foo.json"