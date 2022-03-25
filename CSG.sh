FILE=build/web_modules/three-csg.js

../node_modules/.bin/snowpack build
#ln -s $FILE CSG.js
sed -i -e 's/import/\/\/# sourceMappingURL=three-csg\.js\.map\nimport * as/' $FILE