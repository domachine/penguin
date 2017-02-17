MODULES = \
	index.js \
	inplace.js \
	link.js \
	save_button.js \
	saved_indicator.js

%.js: src/%.js
	@echo "Makefile: build module $@"
	@rollup -c rollup.config.js $< >$@

js: $(MODULES)

clean:
	@echo "Makefile: clean module artifacts"
	@rm -f $(MODULES)
