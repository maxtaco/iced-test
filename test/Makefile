ICED=../node_modules/.bin/iced
SED_PATH_PATTERN="s/\/.+\/(iced-test\/test\/.+\.iced)/\/\1/g"

check : 
	$(ICED) run.iced 2>&1 | sed -E $(SED_PATH_PATTERN) | diff test_output.log -
	@echo "All good - test output does not differ from reference output."
default : check

save :
	$(ICED) run.iced 2>&1 | sed -E $(SED_PATH_PATTERN) > test_output.log

.PHONY: save