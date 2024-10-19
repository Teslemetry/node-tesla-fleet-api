protoc \
    --plugin="protoc-gen-ts=./node_modules/.bin/protoc-gen-ts" \
    --js_out="import_style=commonjs,binary:src/pb2" \
    --ts_out="src/pb2" \
    --ts_opt="esModuleInterop=true" \
    -I=protobuf \
    protobuf/*.proto
