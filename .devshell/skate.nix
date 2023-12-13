{ inputs, ... }: {
	perSystem = { pkgs, lib, ... }: {
		devshells.skate = let
			# Set the Erlang version
			erlangVersion = "erlangR26";

			erlangPackages = pkgs.beam.packages.${erlangVersion};

			inherit (pkgs.lib) optional optionals;

			fileWatchers = with pkgs; (optional stdenv.isLinux inotify-tools
			++ optionals stdenv.isDarwin (with darwin.apple_sdk.frameworks; [
				CoreFoundation
				CoreServices
			]));
		in {
			packages = [
				erlangPackages.erlang
				erlangPackages.elixir_1_15
				erlangPackages.elixir-ls
				erlangPackages.rebar3
				erlangPackages.hex
				pkgs.nodejs_20
				pkgs.entr
				pkgs.lcov
			]
			++ fileWatchers;

			imports = [ "${inputs.devshell}/extra/git/hooks.nix" ];

			git.hooks.enable = true;
			git.hooks.pre-commit.text = lib.concatStringsSep "\n" [
				"mix format --check-formatted"
				"mix compile --force --warnings-as-errors"
				"mix test"
				"mix credo"
				"mix dialyzer"
				"npm --prefix=assets check"
				"npm --prefix=assets test"
			];

			env = let
				fn = attrs: lib.attrsets.mapAttrsToList (lib.nameValuePair) attrs;
			in fn {
				LANG = "C.UTF-8";
				ERL_AFLAGS = "-kernel shell_history enabled";
			};

		};
	};
}
