FILE=build/web_modules/three-csg.js

yarn snowpack build
#ln -s $FILE CSG.js
sed -i -e 's/import/\/\/# sourceMappingURL=three-csg\.js\.map\nimport * as/' $FILE