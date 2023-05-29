import { Container, Content, Logo } from "./styles";
import logo from '../../assets/logoGray.svg'

export function Footer() {
  return(
    <Container>

      <Content>
        <Logo>
          <img src={logo} alt="Logo do Food Explorer" />
          <h1>Food Explorer</h1>
        </Logo>

        <p>© 2023 - Todos os direitos reservados.</p>
      </Content>

    </Container>
  )
}