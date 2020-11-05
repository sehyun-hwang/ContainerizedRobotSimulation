for JS in *.js; do
	sed 's/<script/<script src="..\/'$JS'"/' tests/Template.html > \
	tests/`echo $JS | sed 's/.js//'`.html
done