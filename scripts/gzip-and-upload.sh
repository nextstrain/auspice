echo "GZipping build to s3/"
rm -r s3
mkdir s3
tar -czvf s3/auspice.tar.gz dist src/server index.html

echo "Uploading to s3 nextstrain-bundles bucket"
aws s3 cp s3/ s3://nextstrain-bundles/ --recursive --region=us-east-1
